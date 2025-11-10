import { Env } from '../types';

export async function analyzeFailure(env: Env, rawError: string): Promise<{ readableError: string, fixPrompt: string }> {
    const [readableErrorResult, fixPromptResult] = await Promise.all([
        env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
            prompt: `Translate the following technical error into a human-readable explanation: ${rawError}`,
        }),
        env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
            prompt: `Suggest a fix for the following error: ${rawError}`,
        }),
    ]);


    const readableError = (readableErrorResult.response as string) ?? "Could not generate a human-readable error.";
    const fixPrompt = (fixPromptResult.response as string) ?? "Could not generate a fix prompt.";


    return {
        readableError,
        fixPrompt,
    };
}