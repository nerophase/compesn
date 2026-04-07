import { registerRoomHandlers } from "./event-handlers/room";
import { registerChatHandlers } from "./event-handlers/chat";
import { registerDraftHandlers } from "./event-handlers/draft";
import { registerNotificationHandlers } from "./event-handlers/notifications";

const handlers = {
	registerRoomHandlers,
	registerChatHandlers,
	registerDraftHandlers,
	registerNotificationHandlers,
};

export { handlers };
