using System.Threading.Channels;

namespace PrintCraftApi.Services;

public interface IPricingQueue
{
    ValueTask QueueOrderItemAsync(Guid orderItemId, CancellationToken cancellationToken = default);
    ValueTask<Guid> DequeueAsync(CancellationToken cancellationToken);
}

public class PricingQueue : IPricingQueue
{
    private readonly Channel<Guid> _queue;

    public PricingQueue()
    {
        var options = new BoundedChannelOptions(100)
        {
            FullMode = BoundedChannelFullMode.Wait
        };
        _queue = Channel.CreateBounded<Guid>(options);
    }

    public async ValueTask QueueOrderItemAsync(Guid orderItemId, CancellationToken cancellationToken = default)
    {
        await _queue.Writer.WriteAsync(orderItemId, cancellationToken);
    }

    public async ValueTask<Guid> DequeueAsync(CancellationToken cancellationToken)
    {
        return await _queue.Reader.ReadAsync(cancellationToken);
    }
}

