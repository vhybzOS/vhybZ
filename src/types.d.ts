export type Prompt = string | ((params?: Record<string, any>) => string | Promise<string>)

export type PromptProvider = (name: string) => string | Prompt;
