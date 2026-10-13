using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using System.Threading;
using System.Threading.Tasks;
using PrintCraftApi.Data;
using PrintCraftApi.Models;
using System;
using System.IO;

namespace PrintCraftApi.Services
{
    public class AutoForgeWorker : BackgroundService
    {
        private readonly AutoForgeQueueService _queueService;
        private readonly IServiceProvider _serviceProvider;

        public AutoForgeWorker(AutoForgeQueueService queueService, IServiceProvider serviceProvider)
        {
            _queueService = queueService;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var jobItem = await _queueService.DequeueJobAsync(stoppingToken);

                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var dbContext = scope.ServiceProvider.GetRequiredService<PrintCraftDb>();
                        var autoForgeService = scope.ServiceProvider.GetRequiredService<AutoForgeService>();

                        var job = await dbContext.AutoForgeJobs.FindAsync(new object[] { jobItem.JobId }, stoppingToken);
                        if (job == null) continue;

                        job.Status = "Processing";
                        await dbContext.SaveChangesAsync(stoppingToken);

                        try
                        {
                            string templateName = "template_016mm.3mf";
                            if (jobItem.Quality.Contains("0.12") || jobItem.Quality.Contains("012"))
                            {
                                templateName = "template_012mm.3mf";
                            }
                            else if (jobItem.Quality.Contains("0.22") || jobItem.Quality.Contains("022"))
                            {
                                templateName = "template_022mm.3mf";
                            }

                            string templatePath = Path.Combine(Directory.GetCurrentDirectory(), "PrintTemplates", templateName);

                            if (!System.IO.File.Exists(templatePath))
                            {
                                var files = Directory.GetFiles(Path.Combine(Directory.GetCurrentDirectory(), "PrintTemplates"), "*.3mf");
                                if (files.Length > 0)
                                {
                                    templatePath = files[0];
                                }
                                else
                                {
                                    throw new Exception("Template 3MF file not found on server.");
                                }
                            }

                            var output3mfPath = await autoForgeService.Generate3MfAsync(
                                jobItem.TempImagePath,
                                jobItem.Colors,
                                jobItem.Size,
                                jobItem.Quality,
                                templatePath
                            );

                            var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "autoforge");
                            if (!Directory.Exists(uploadsDir))
                            {
                                Directory.CreateDirectory(uploadsDir);
                            }
                            
                            var finalFileName = $"{jobItem.JobId}.3mf";
                            var finalFilePath = Path.Combine(uploadsDir, finalFileName);
                            
                            System.IO.File.Move(output3mfPath, finalFilePath, true);

                            job.Status = "Complete";
                            job.FilePath = finalFilePath;
                            job.CompletedAt = DateTime.UtcNow;
                        }
                        catch (Exception ex)
                        {
                            job.Status = "Failed";
                            job.ErrorMessage = ex.Message;
                            job.CompletedAt = DateTime.UtcNow;
                        }
                        finally
                        {
                            await dbContext.SaveChangesAsync(stoppingToken);

                            if (System.IO.File.Exists(jobItem.TempImagePath))
                            {
                                System.IO.File.Delete(jobItem.TempImagePath);
                            }
                        }
                    }
                }
                catch (OperationCanceledException)
                {
                    // Graceful shutdown
                    break;
                }
                catch (Exception ex)
                {
                    // Log error and continue to prevent worker from crashing completely
                    Console.WriteLine($"[AutoForgeWorker] Error processing queue item: {ex.Message}");
                }
            }
        }
    }
}

