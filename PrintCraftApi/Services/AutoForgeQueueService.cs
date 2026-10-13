using System.Threading.Channels;
using System.Threading;
using System.Threading.Tasks;
using System;

namespace PrintCraftApi.Services
{
    public class AutoForgeJobQueueItem
    {
        public Guid JobId { get; set; }
        public string TempImagePath { get; set; } = string.Empty;
        public string[] Colors { get; set; } = Array.Empty<string>();
        public string Size { get; set; } = string.Empty;
        public string Quality { get; set; } = string.Empty;
    }

    public class AutoForgeQueueService
    {
        private readonly Channel<AutoForgeJobQueueItem> _queue;

        public AutoForgeQueueService()
        {
            _queue = Channel.CreateUnbounded<AutoForgeJobQueueItem>();
        }

        public async Task EnqueueJobAsync(AutoForgeJobQueueItem item)
        {
            await _queue.Writer.WriteAsync(item);
        }

        public async Task<AutoForgeJobQueueItem> DequeueJobAsync(CancellationToken cancellationToken)
        {
            return await _queue.Reader.ReadAsync(cancellationToken);
        }
    }
}

