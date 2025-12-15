import type { Entry } from '@/types'

export interface LLMResponse {
  answer: string
  followups?: string[]
}

export interface LLMProvider {
  generateAnswer(question: string, entries: Entry[]): Promise<LLMResponse>
}

class AnthropicProvider implements LLMProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateAnswer(question: string, entries: Entry[]): Promise<LLMResponse> {
    if (entries.length === 0) {
      return {
        answer: "Ich habe keine passenden Einträge zu dieser Frage gefunden. Bitte füge Wissen hinzu oder formuliere die Frage anders."
      }
    }

    const context = entries.map((e, i) =>
      `[${i + 1}] Topic: ${e.topic}\nType: ${e.type}\n${e.content}`
    ).join('\n\n---\n\n')

    const prompt = `Du bist ein Wissensassistent. Beantworte die folgende Frage ausschließlich basierend auf den gegebenen Wissenseinträgen.

Verfügbare Wissenseinträge:
${context}

Frage: ${question}

Regeln:
- Antworte nur aus den gegebenen Einträgen
- Erfinde nichts hinzu
- Verweise auf die Quellen mit [1], [2], etc.
- Wenn die Einträge die Frage nicht beantworten können, sage das klar
- Formuliere 1-2 mögliche Folgefragen, falls relevant

Antworte im Format:
ANTWORT: [deine Antwort]
FOLLOWUPS: [Folgefrage 1] | [Folgefrage 2]`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`)
    }

    const data = await response.json()
    const text = data.content[0].text

    const answerMatch = text.match(/ANTWORT:\s*([\s\S]*?)(?:\nFOLLOWUPS:|$)/)
    const followupsMatch = text.match(/FOLLOWUPS:\s*(.*)/)

    const answer = answerMatch ? answerMatch[1].trim() : text
    const followups = followupsMatch
      ? followupsMatch[1].split('|').map((f: string) => f.trim()).filter((f: string) => f.length > 0)
      : undefined

    return { answer, followups }
  }
}

class OpenAIProvider implements LLMProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateAnswer(question: string, entries: Entry[]): Promise<LLMResponse> {
    if (entries.length === 0) {
      return {
        answer: "Ich habe keine passenden Einträge zu dieser Frage gefunden. Bitte füge Wissen hinzu oder formuliere die Frage anders."
      }
    }

    const context = entries.map((e, i) =>
      `[${i + 1}] Topic: ${e.topic}\nType: ${e.type}\n${e.content}`
    ).join('\n\n---\n\n')

    const prompt = `Du bist ein Wissensassistent. Beantworte die folgende Frage ausschließlich basierend auf den gegebenen Wissenseinträgen.

Verfügbare Wissenseinträge:
${context}

Frage: ${question}

Regeln:
- Antworte nur aus den gegebenen Einträgen
- Erfinde nichts hinzu
- Verweise auf die Quellen mit [1], [2], etc.
- Wenn die Einträge die Frage nicht beantworten können, sage das klar
- Formuliere 1-2 mögliche Folgefragen, falls relevant

Antworte im Format:
ANTWORT: [deine Antwort]
FOLLOWUPS: [Folgefrage 1] | [Folgefrage 2]`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const text = data.choices[0].message.content

    const answerMatch = text.match(/ANTWORT:\s*([\s\S]*?)(?:\nFOLLOWUPS:|$)/)
    const followupsMatch = text.match(/FOLLOWUPS:\s*(.*)/)

    const answer = answerMatch ? answerMatch[1].trim() : text
    const followups = followupsMatch
      ? followupsMatch[1].split('|').map((f: string) => f.trim()).filter((f: string) => f.length > 0)
      : undefined

    return { answer, followups }
  }
}

class MockProvider implements LLMProvider {
  async generateAnswer(question: string, entries: Entry[]): Promise<LLMResponse> {
    if (entries.length === 0) {
      return {
        answer: "Ich habe keine passenden Einträge zu dieser Frage gefunden. Bitte füge Wissen hinzu oder formuliere die Frage anders."
      }
    }

    const relevantEntries = entries.slice(0, 3)

    let answer = `Basierend auf den gespeicherten Einträgen:\n\n`

    relevantEntries.forEach((entry, i) => {
      answer += `[${i + 1}] ${entry.content.substring(0, 200)}${entry.content.length > 200 ? '...' : ''}\n\n`
    })

    answer += `\n(Mock-Modus: Für intelligente Antworten füge einen API-Key hinzu)`

    return {
      answer,
      followups: entries.length > 1 ? [
        `Was gibt es noch zu ${entries[0].topic}?`,
        `Kannst du mehr Details geben?`
      ] : undefined
    }
  }
}

export function getLLMProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER || 'mock'

  if (provider === 'mock') {
    return new MockProvider()
  }

  if (provider === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')
    return new AnthropicProvider(apiKey)
  }

  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY not set')
    return new OpenAIProvider(apiKey)
  }

  throw new Error(`Unknown LLM provider: ${provider}`)
}
