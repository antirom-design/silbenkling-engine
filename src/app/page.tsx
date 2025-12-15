'use client'

import { useState } from 'react'

interface Source {
  entry_id: string
  topic: string
  type: string
  excerpt: string
}

interface Answer {
  answer: string
  sources: Source[]
  followups?: string[]
  question: string
}

export default function Home() {
  const [tab, setTab] = useState<'ask' | 'add' | 'monitor'>('ask')
  const [question, setQuestion] = useState('')
  const [topic, setTopic] = useState('/team')
  const [loading, setLoading] = useState(false)
  const [currentAnswer, setCurrentAnswer] = useState<Answer | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [addType, setAddType] = useState<string>('doc')
  const [addContent, setAddContent] = useState('')

  const actor = 'user'

  const handleAsk = async () => {
    if (!question.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          topic,
          actor
        })
      })

      const data = await response.json()

      if (data.success) {
        setCurrentAnswer({
          answer: data.answer,
          sources: data.sources,
          followups: data.followups,
          question
        })
      } else {
        setError(data.error || 'Fehler bei der Anfrage')
      }
    } catch (err) {
      setError('Netzwerkfehler')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveQA = async () => {
    if (!currentAnswer) return

    try {
      const response = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentAnswer.question,
          answer: currentAnswer.answer,
          topic,
          actor
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('Q&A gespeichert!')
      } else {
        alert('Fehler beim Speichern')
      }
    } catch (err) {
      alert('Netzwerkfehler')
    }
  }

  const handleAddEntry = async () => {
    if (!addContent.trim()) return

    try {
      const response = await fetch('/api/put', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          type: addType,
          content: addContent,
          actor
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('Eintrag hinzugefügt!')
        setAddContent('')
      } else {
        alert('Fehler beim Hinzufügen')
      }
    } catch (err) {
      alert('Netzwerkfehler')
    }
  }

  return (
    <div className="container">
      <header>
        <h1>silbenkling</h1>
        <p className="subtitle">Lokale Intranet-KI für Teams</p>
      </header>

      <div className="tabs">
        <button
          className={`tab ${tab === 'ask' ? 'active' : ''}`}
          onClick={() => setTab('ask')}
        >
          GET - Fragen
        </button>
        <button
          className={`tab ${tab === 'add' ? 'active' : ''}`}
          onClick={() => setTab('add')}
        >
          PUT - Wissen hinzufügen
        </button>
      </div>

      {tab === 'ask' && (
        <>
          <div className="card">
            <div className="input-group">
              <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option value="/team">/team</option>
                <option value="/team/onboarding">/team/onboarding</option>
                <option value="/team/prozesse">/team/prozesse</option>
                <option value="/projekt">/projekt</option>
              </select>
              <input
                type="text"
                placeholder="Stelle eine Frage..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
              />
              <button onClick={handleAsk} disabled={loading}>
                {loading ? 'Suche...' : 'Fragen'}
              </button>
            </div>
          </div>

          {error && (
            <div className="card">
              <div className="error">{error}</div>
            </div>
          )}

          {currentAnswer && (
            <div className="card">
              <div className="answer">{currentAnswer.answer}</div>

              {currentAnswer.sources.length > 0 && (
                <div className="sources">
                  <h3>Quellen</h3>
                  {currentAnswer.sources.map((source, i) => (
                    <div key={source.entry_id} className="source-item">
                      <span className="topic">[{i + 1}] {source.topic}</span>
                      <span className="type">{source.type}</span>
                      <div>{source.excerpt}</div>
                    </div>
                  ))}
                </div>
              )}

              {currentAnswer.followups && currentAnswer.followups.length > 0 && (
                <div className="followups">
                  <h3>Mögliche Folgefragen</h3>
                  {currentAnswer.followups.map((followup, i) => (
                    <div
                      key={i}
                      className="followup-item"
                      onClick={() => {
                        setQuestion(followup)
                        handleAsk()
                      }}
                    >
                      {followup}
                    </div>
                  ))}
                </div>
              )}

              <div className="actions">
                <button onClick={handleSaveQA}>Als Q&A speichern</button>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'add' && (
        <div className="card">
          <div className="input-group">
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="/team">/team</option>
              <option value="/team/onboarding">/team/onboarding</option>
              <option value="/team/prozesse">/team/prozesse</option>
              <option value="/projekt">/projekt</option>
            </select>
            <select value={addType} onChange={(e) => setAddType(e.target.value)}>
              <option value="doc">Dokument</option>
              <option value="qa">Q&A</option>
              <option value="fact">Fakt</option>
              <option value="task">Aufgabe</option>
              <option value="link">Link</option>
            </select>
          </div>
          <textarea
            placeholder="Inhalt des Eintrags..."
            value={addContent}
            onChange={(e) => setAddContent(e.target.value)}
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              marginBottom: '1rem'
            }}
          />
          <button onClick={handleAddEntry}>Eintrag hinzufügen</button>
        </div>
      )}
    </div>
  )
}
