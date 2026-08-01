using Microsoft.AspNetCore.SignalR;

namespace JobPortalAPI.Hubs
{
    public class SkillGapHub : Hub
    {
        // Called by the React client right after connection.start().
        // Adds this connection to a "group" named after its own connectionId,
        // so the controller can push updates to exactly this client later.
        public async Task JoinAnalysis(string connectionId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, connectionId);
        }
    }
}


