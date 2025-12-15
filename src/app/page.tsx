'use client'

import { useState, useEffect } from 'react'

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

interface Entry {
  id: string
  topic: string
  type: string
  content: string
  metadata: {
    created_at: string
    created_by: string
  }
}

interface Event {
  id: string
  type: string
  timestamp: string
  topic: string
  payload?: any
}

export default function Home() {
  const [tab, setTab] = useState<'get' | 'put' | 'monitor'>('get')
  const [question, setQuestion] = useState('')
  const [topicFilter, setTopicFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentAnswer, setCurrentAnswer] = useState<Answer | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [addTopic, setAddTopic] = useState('')
  const [addType, setAddType] = useState<string>('doc')
  const [addContent, setAddContent] = useState('')
  const [allTopics, setAllTopics] = useState<string[]>([])
  const [showTopicSuggestions, setShowTopicSuggestions] = useState(false)

  const [monitorTopic, setMonitorTopic] = useState('')
  const [monitorType, setMonitorType] = useState('')
  const [monitorResults, setMonitorResults] = useState<Event[]>([])

  const actor = 'user'

  useEffect(() => {
    fetchTopics()
  }, [])

  const fetchTopics = async () => {
    try {
      const response = await fetch('/api/topics')
      const data = await response.json()
      if (data.success) {
        setAllTopics(data.topics || [])
      }
    } catch (err) {
      console.error('Failed to fetch topics:', err)
    }
  }

  const filteredTopics = allTopics.filter(t =>
    t.toLowerCase().includes(addTopic.toLowerCase())
  )

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
          topic: topicFilter || '%',
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
        setError(data.error || 'Error')
      }
    } catch (err) {
      setError('Network error')
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
          topic: topicFilter || '/general',
          actor
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('✓ Gespeichert')
        fetchTopics()
      } else {
        alert('✗ Fehler')
      }
    } catch (err) {
      alert('✗ Network error')
    }
  }

  const handleAddEntry = async () => {
    if (!addContent.trim() || !addTopic.trim()) return

    try {
      const response = await fetch('/api/put', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: addTopic,
          type: addType,
          content: addContent,
          actor
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('✓ Hinzugefügt')
        setAddContent('')
        setAddTopic('')
        fetchTopics()
      } else {
        alert('✗ Fehler: ' + (data.error || 'Unknown'))
      }
    } catch (err) {
      alert('✗ Network error: ' + err)
    }
  }

  const handleMonitor = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: monitorTopic || undefined,
          event_types: monitorType ? [monitorType] : undefined,
          actor
        })
      })

      const data = await response.json()

      if (data.success) {
        setMonitorResults(data.events || [])
      } else {
        setError(data.error || 'Error')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: 'monospace', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <pre style={{ fontSize: '10px', lineHeight: '1', marginBottom: '20px' }}>
{`
 _____ _ _ _               _    _ _
/  ___(_) | |             | |  | (_)
\\ \`--.  _| | |__   ___ _ __ | | _| |_ _ __   __ _
 \`--. \\| | | '_ \\ / _ \\ '_ \\| |/ / | | '_ \\ / _\` |
/\\__/ / | | |_) |  __/ | | |   <| | | | | | (_| |
\\____/|_|_|_.__/ \\___|_| |_|_|\\_\\_|_|_| |_|\\__, |
                                            __/ |
                                           |___/
`}
      </pre>

      <div style={{ marginBottom: '20px', borderBottom: '1px solid #333' }}>
        <button onClick={() => setTab('get')} style={{
          padding: '10px 20px',
          background: tab === 'get' ? '#000' : 'transparent',
          color: tab === 'get' ? '#0f0' : '#666',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'monospace'
        }}>
          [ GET ]
        </button>
        <button onClick={() => setTab('put')} style={{
          padding: '10px 20px',
          background: tab === 'put' ? '#000' : 'transparent',
          color: tab === 'put' ? '#0f0' : '#666',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'monospace'
        }}>
          [ PUT ]
        </button>
        <button onClick={() => setTab('monitor')} style={{
          padding: '10px 20px',
          background: tab === 'monitor' ? '#000' : 'transparent',
          color: tab === 'monitor' ? '#0f0' : '#666',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'monospace'
        }}>
          [ MONITOR ]
        </button>
      </div>

      {tab === 'get' && (
        <div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>topic (was wird durchsucht, wildcards work)</label>
            <input
              type="text"
              placeholder="z.B. '8a' oder 'team' oder leer für alles"
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                fontFamily: 'monospace',
                border: '1px solid #333',
                background: '#000',
                color: '#0f0'
              }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>frage (instruction an die ki, was sie mit den entries machen soll)</label>
            <input
              type="text"
              placeholder="z.B. 'Fasse zusammen' oder 'Was sind die wichtigsten Punkte?'"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
              style={{
                width: '100%',
                padding: '10px',
                fontFamily: 'monospace',
                border: '1px solid #333',
                background: '#000',
                color: '#0f0'
              }}
            />
          </div>

          <button
            onClick={handleAsk}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: '#000',
              color: '#0f0',
              border: '1px solid #0f0',
              cursor: loading ? 'wait' : 'pointer',
              fontFamily: 'monospace',
              width: '100%'
            }}
          >
            {loading ? '...' : '[ FRAGEN ]'}
          </button>

          {error && (
            <pre style={{ marginTop: '20px', color: '#f00', border: '1px solid #f00', padding: '10px' }}>
              {error}
            </pre>
          )}

          {currentAnswer && (
            <div style={{ marginTop: '20px' }}>
              <pre style={{
                whiteSpace: 'pre-wrap',
                border: '1px solid #0f0',
                padding: '10px',
                background: '#001100',
                color: '#0f0'
              }}>
                {currentAnswer.answer}
              </pre>

              {currentAnswer.sources.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ color: '#666', marginBottom: '5px' }}>── quellen ──</div>
                  {currentAnswer.sources.map((source, i) => (
                    <div key={source.entry_id} style={{
                      marginBottom: '5px',
                      padding: '5px',
                      border: '1px solid #333',
                      fontSize: '12px'
                    }}>
                      <span style={{ color: '#0f0' }}>[{i + 1}]</span> {source.topic}
                      <span style={{ color: '#666' }}> ({source.type})</span>
                      <div style={{ color: '#666', fontSize: '11px' }}>{source.excerpt}</div>
                    </div>
                  ))}
                </div>
              )}

              {currentAnswer.followups && currentAnswer.followups.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ color: '#666', marginBottom: '5px' }}>── followups ──</div>
                  {currentAnswer.followups.map((f, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setQuestion(f)
                        handleAsk()
                      }}
                      style={{
                        padding: '5px',
                        border: '1px solid #333',
                        marginBottom: '5px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      → {f}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleSaveQA}
                style={{
                  marginTop: '10px',
                  padding: '10px',
                  background: '#000',
                  color: '#0f0',
                  border: '1px solid #0f0',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  width: '100%'
                }}
              >
                [ ALS Q&A SPEICHERN ]
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'put' && (
        <div>
          <div style={{ marginBottom: '10px', position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>topic</label>
            <input
              type="text"
              placeholder="z.B. '8a', 'team/onboarding', ..."
              value={addTopic}
              onChange={(e) => {
                setAddTopic(e.target.value)
                setShowTopicSuggestions(e.target.value.length > 0)
              }}
              onFocus={() => setShowTopicSuggestions(addTopic.length > 0)}
              onBlur={() => setTimeout(() => setShowTopicSuggestions(false), 200)}
              style={{
                width: '100%',
                padding: '10px',
                fontFamily: 'monospace',
                border: '1px solid #333',
                background: '#000',
                color: '#0f0'
              }}
            />
            {showTopicSuggestions && filteredTopics.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#000',
                border: '1px solid #0f0',
                maxHeight: '150px',
                overflowY: 'auto',
                zIndex: 10
              }}>
                {filteredTopics.map(t => (
                  <div
                    key={t}
                    onClick={() => {
                      setAddTopic(t)
                      setShowTopicSuggestions(false)
                    }}
                    style={{
                      padding: '5px 10px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #333',
                      color: '#0f0'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#001100'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#000'}
                  >
                    {t}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>type (optional)</label>
            <select
              value={addType}
              onChange={(e) => setAddType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                fontFamily: 'monospace',
                border: '1px solid #333',
                background: '#000',
                color: '#0f0'
              }}
            >
              <option value="doc">doc</option>
              <option value="qa">qa</option>
              <option value="fact">fact</option>
              <option value="task">task</option>
              <option value="link">link</option>
              <option value="event">event</option>
            </select>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>content</label>
            <textarea
              placeholder="Wissen..."
              value={addContent}
              onChange={(e) => setAddContent(e.target.value)}
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '10px',
                fontFamily: 'monospace',
                border: '1px solid #333',
                background: '#000',
                color: '#0f0',
                resize: 'vertical'
              }}
            />
          </div>

          <button
            onClick={handleAddEntry}
            style={{
              padding: '10px 20px',
              background: '#000',
              color: '#0f0',
              border: '1px solid #0f0',
              cursor: 'pointer',
              fontFamily: 'monospace',
              width: '100%'
            }}
          >
            [ HINZUFÜGEN ]
          </button>
        </div>
      )}

      {tab === 'monitor' && (
        <div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>topic filter (wildcards)</label>
            <input
              type="text"
              placeholder="z.B. '8a' oder leer für alles"
              value={monitorTopic}
              onChange={(e) => setMonitorTopic(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                fontFamily: 'monospace',
                border: '1px solid #333',
                background: '#000',
                color: '#0f0'
              }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>event type (optional)</label>
            <select
              value={monitorType}
              onChange={(e) => setMonitorType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                fontFamily: 'monospace',
                border: '1px solid #333',
                background: '#000',
                color: '#0f0'
              }}
            >
              <option value="">alle</option>
              <option value="entry_added">entry_added</option>
              <option value="entry_updated">entry_updated</option>
              <option value="question_asked">question_asked</option>
              <option value="question_answered">question_answered</option>
              <option value="question_unanswered">question_unanswered</option>
              <option value="qa_confirmed">qa_confirmed</option>
            </select>
          </div>

          <button
            onClick={handleMonitor}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: '#000',
              color: '#0f0',
              border: '1px solid #0f0',
              cursor: loading ? 'wait' : 'pointer',
              fontFamily: 'monospace',
              width: '100%',
              marginBottom: '20px'
            }}
          >
            {loading ? '...' : '[ ANZEIGEN ]'}
          </button>

          {monitorResults.length > 0 && (
            <div>
              <div style={{ color: '#666', marginBottom: '10px' }}>
                {monitorResults.length} events gefunden
              </div>
              {monitorResults.map((event, i) => (
                <div
                  key={event.id}
                  style={{
                    marginBottom: '10px',
                    padding: '10px',
                    border: '1px solid #333',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ color: '#0f0' }}>
                    [{new Date(event.timestamp).toLocaleString()}] {event.type}
                  </div>
                  <div style={{ color: '#666' }}>
                    topic: {event.topic} | actor: {event.actor}
                  </div>
                  {event.payload && (
                    <pre style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}

          {monitorResults.length === 0 && !loading && (
            <div style={{ color: '#666', textAlign: 'center' }}>
              Keine Events gefunden
            </div>
          )}
        </div>
      )}
    </div>
  )
}
