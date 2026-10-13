using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.IO;
using System;
using PrintCraftApi.Services;
using PrintCraftApi.Data;
using PrintCraftApi.Models;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace PrintCraftApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AutoForgeController : ControllerBase
    {
        private readonly AutoForgeQueueService _queueService;
        private readonly PrintCraftDb _dbContext;

        public AutoForgeController(AutoForgeQueueService queueService, PrintCraftDb dbContext)
        {
            _queueService = queueService;
            _dbContext = dbContext;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> Generate([FromForm] AutoForgeRequest request)
        {
            if (request.Image == null || request.Image.Length == 0)
            {
                return BadRequest("Image is required.");
            }

            if (request.Colors == null || request.Colors.Count != 4)
            {
                return BadRequest("Exactly 4 colors must be provided.");
            }

            if (string.IsNullOrEmpty(request.Size))
            {
                return BadRequest("Size is required.");
            }

            if (string.IsNullOrEmpty(request.Quality))
            {
                return BadRequest("Quality is required.");
            }

            OrderItem? orderItem = null;
            if (request.OrderItemId.HasValue)
            {
                orderItem = await _dbContext.OrderItems.FindAsync(request.OrderItemId.Value);
                if (orderItem != null && orderItem.AutoForgeJobId.HasValue)
                {
                    var existingJob = await _dbContext.AutoForgeJobs.FindAsync(orderItem.AutoForgeJobId.Value);
                    if (existingJob != null && existingJob.Status != "Failed")
                    {
                        return Ok(new { jobId = existingJob.Id, existing = true });
                    }
                }
            }

            var job = new AutoForgeJob
            {
                Id = Guid.NewGuid(),
                Status = "Pending"
            };
            _dbContext.AutoForgeJobs.Add(job);
            
            if (orderItem != null)
            {
                orderItem.AutoForgeJobId = job.Id;
            }

            await _dbContext.SaveChangesAsync();

            string tempImagePath = Path.GetTempFileName();
            
            using (var stream = new FileStream(tempImagePath, FileMode.Create))
            {
                await request.Image.CopyToAsync(stream);
            }

            await _queueService.EnqueueJobAsync(new AutoForgeJobQueueItem
            {
                JobId = job.Id,
                TempImagePath = tempImagePath,
                Colors = request.Colors.ToArray(),
                Size = request.Size,
                Quality = request.Quality
            });

            return Ok(new { jobId = job.Id, existing = false });
        }

        [HttpGet("status/{jobId}")]
        public async Task<IActionResult> GetStatus(Guid jobId)
        {
            var job = await _dbContext.AutoForgeJobs.FindAsync(jobId);
            if (job == null) return NotFound();

            return Ok(new
            {
                status = job.Status,
                errorMessage = job.ErrorMessage
            });
        }

        [HttpGet("download/{jobId}")]
        public async Task<IActionResult> Download(Guid jobId)
        {
            var job = await _dbContext.AutoForgeJobs.FindAsync(jobId);
            if (job == null) return NotFound();

            if (job.Status != "Complete" || string.IsNullOrEmpty(job.FilePath) || !System.IO.File.Exists(job.FilePath))
            {
                return BadRequest("File is not ready or does not exist.");
            }

            byte[] fileBytes = await System.IO.File.ReadAllBytesAsync(job.FilePath);
            return File(fileBytes, "application/vnd.ms-3mfdocument", "output.3mf");
        }

        [HttpDelete("{jobId}")]
        public async Task<IActionResult> DeleteJob(Guid jobId)
        {
            var job = await _dbContext.AutoForgeJobs.FindAsync(jobId);
            if (job == null) return NotFound();

            // Find related OrderItem and clear the reference
            var orderItem = await _dbContext.OrderItems.FirstOrDefaultAsync(oi => oi.AutoForgeJobId == jobId);
            if (orderItem != null)
            {
                orderItem.AutoForgeJobId = null;
            }

            _dbContext.AutoForgeJobs.Remove(job);
            await _dbContext.SaveChangesAsync();

            if (!string.IsNullOrEmpty(job.FilePath) && System.IO.File.Exists(job.FilePath))
            {
                try { System.IO.File.Delete(job.FilePath); } catch { }
            }

            return Ok();
        }
    }

    public class AutoForgeRequest
    {
        public IFormFile? Image { get; set; }
        public List<string>? Colors { get; set; }
        public string? Size { get; set; }
        public string? Quality { get; set; }
        public Guid? OrderItemId { get; set; }
    }
}
