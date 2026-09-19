import astroWorker from "./dist/server/entry.mjs";

const runtimeEnvKey = "__rocktownOffersRuntimeEnv";

export default {
  fetch(request, env, context) {
    for (const [key, value] of Object.entries(env)) {
      if (typeof value === "string") {
        globalThis.process.env[key] = value;
      }
    }
    globalThis[runtimeEnvKey] = env;
    return astroWorker.fetch(request, env, context);
  },
};
