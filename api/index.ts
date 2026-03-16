import { app } from "../backend/index";

export default function handler(req: any, res: any) {
  return app(req, res);
}
