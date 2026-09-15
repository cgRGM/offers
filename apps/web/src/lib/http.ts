export const json = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status });

export const parseJson = async (request: Request): Promise<unknown | null> => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};
