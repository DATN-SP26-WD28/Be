export const SOCKET_EVENTS = {
  CONNECT: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_TABLE: 'join:table',
  JOIN_ORDER: 'join:order',
  JOIN_ADMIN_ORDERS: 'join:admin-orders',
  ORDER_CREATED: 'order:created',
  ORDER_ITEM_STATUS_UPDATED: 'order:item-status-updated',
}

export const SOCKET_ROOMS = {
  ADMIN_ORDERS: 'admin:orders',
  table: (tableRef) => `table:${tableRef}`,
  order: (orderId) => `order:${orderId}`,
}
