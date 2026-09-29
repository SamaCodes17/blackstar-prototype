import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, ArrowRight } from 'lucide-react';
import type { State } from '../../core/types';
import { explainAssessment } from '../../core/explainer';
import { fullMoney } from '../currency';
import { Modal } from '../shared';
import type { View } from './Workspace';
export function Assistant({
  state,
  view,
  question,
  close,
  navigate,
}: {
  state: State;
  view: View;
  question: string;
  close: () => void;
  navigate: (view: View) => void;
}) {
  const [messages, setMessages] = useState([
    { question, ...explainAssessment(question, state, view) },
  ]);
  const [draft, setDraft] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [messages]);
  function send(text: string) {
    if (!text.trim()) return;
    setMessages((previous) => [
      ...previous,
      { question: text.trim(), ...explainAssessment(text, state, view) },
    ]);
    setDraft('');
  }
  return (
    <Modal title="Ask BlackStar" close={close}>
      <div className="ws-assistant">
        <p className="ws-assistant-label">
          <Sparkles size={16} /> Your assessment, explained simply.
        </p>
        <p className="ws-assistant-note">
          Local guide · answers from {state.org.name}’s current assessment. No external AI service.
        </p>
        <div className="ws-chat-log" role="log" aria-live="polite" aria-label="Conversation">
          {messages.map((message, i) => {
            const m = {
              question: message.question,
              ...explainAssessment(message.question, state, view, fullMoney),
            };
            return (
              <div key={i}>
                <p className="ws-chat-question">{m.question}</p>
                <div className="ws-chat-answer">
                  <strong>BLACKSTAR</strong>
                  <p>{m.text}</p>
                  <button
                    className="ws-text-button"
                    onClick={() => {
                      navigate(m.destination);
                      close();
                    }}
                  >
                    Open{' '}
                    {m.destination === 'risk'
                      ? 'attack paths'
                      : m.destination === 'report'
                        ? 'board brief'
                        : m.destination}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
          <div ref={end} />
        </div>
        <div className="ws-suggestions">
          {['Are these numbers genuine?', 'Is Shodan working?', 'Why was this plan selected?'].map(
            (q) => (
              <button key={q} onClick={() => send(q)}>
                {q}
              </button>
            ),
          )}
        </div>
        <form
          className="ws-chat-form"
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <label className="sr-only" htmlFor="assistant-question">
            Ask about this assessment
          </label>
          <input
            id="assistant-question"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={1000}
            placeholder="Ask about a metric, source or decision…"
          />
          <button
            className="exec-button primary"
            type="submit"
            disabled={!draft.trim()}
            aria-label="Send question"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </Modal>
  );
}
