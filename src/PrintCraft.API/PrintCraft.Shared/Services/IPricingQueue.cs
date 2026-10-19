namespace PrintCraft.Shared.Services;

public interface IPricingQueue
{
    ValueTask QueueOrderItemAsync(Guid orderItemId, CancellationToken cancellationToken = default);
    ValueTask<Guid> DequeueAsync(CancellationToken cancellationToken);
}

