export default async (req: any, res: any) => {
  try {
    const { app } = await import("../backend/index");
    return app(req, res);
  } catch (e: any) {
    res.status(500).json({
      error: "Cold Start Failure",
      message: e.toString(),
      stack: e.stack
    });
  }
};
