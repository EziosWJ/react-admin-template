import { customerHandlers } from './customers';
import { dashboardHandlers } from './dashboard';
import { orderHandlers } from './orders';
import { projectHandlers } from './projects';
import { userHandlers } from './users';

export const handlers = [
  ...dashboardHandlers,
  ...customerHandlers,
  ...projectHandlers,
  ...orderHandlers,
  ...userHandlers,
];
