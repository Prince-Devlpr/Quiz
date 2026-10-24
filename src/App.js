
import { useState, useEffect, useCallback } from "react";
import questionsData from "./ques.json";
import "./App.css";

// --------------------------------------------------
// Utility functions
// --------------------------------------------------

function shuffle(arr) {
  const a = [...arr];

  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }

  return a;
}

function prepareQuestions(questions) {
  return shuffle(questions).map((q) => ({
    ...q,
    options: shuffle(q.options),
  }));
}

// Always treat answers as arrays internally.
function getCorrectAnswers(question) {
  return Array.isArray(question.answer)
    ? question.answer
    : [question.answer];
}

function isAnswerCorrect(question, selected) {
  const correct = getCorrectAnswers(question);

  return (
    selected.length === correct.length &&
    correct.every((answer) => selected.includes(answer))
  );
}

const SCREEN = {
  HOME: "HOME",
  WEEK_SELECT: "WEEK_SELECT",
  MULTI_WEEK_SELECT: "MULTI_WEEK_SELECT",
  QUIZ: "QUIZ",
  RESULTS: "RESULTS",
};

// --------------------------------------------------
// Home screen
// --------------------------------------------------

function HomeScreen({ onSelect, wrongCount }) {
  const weeks = [
    ...new Set(questionsData.map((q) => q.week)),
  ].sort((a, b) => a - b);

  return (
    <div className="home-screen">
      <div className="home-hero">
        <div className="logo-mark">
          <span>NPTEL</span>
          <div className="logo-dot" />
        </div>

        <h1>Quiz Arena</h1>

        <p className="tagline">
          Master NPTEL Cloud Computing (IIT Kharagpur)
        </p>
      </div>

      <div className="mode-grid">
        <button
          className="mode-card card-week"
          onClick={() => onSelect("week")}
        >
          <div className="card-icon">📅</div>
          <h2>Week Wise</h2>
          <p>Practice questions from a specific week at your own pace</p>
          <div className="card-badge">{weeks.length} Weeks</div>
        </button>

        <button
          className="mode-card card-multi"
          onClick={() => onSelect("multi")}
        >
          <div className="card-icon">🗓️</div>
          <h2>Multi-Week</h2>
          <p>Pick multiple weeks and quiz across all selected content</p>
          <div className="card-badge">{weeks.length} Weeks</div>
        </button>

        <button
          className="mode-card card-full"
          onClick={() => onSelect("full")}
        >
          <div className="card-icon">🌐</div>
          <h2>Full Syllabus</h2>
          <p>Challenge yourself with questions from the entire syllabus</p>
          <div className="card-badge">
            {questionsData.length} Questions
          </div>
        </button>

        <button
          className={`mode-card card-review ${
            wrongCount === 0 ? "disabled" : ""
          }`}
          onClick={() => wrongCount > 0 && onSelect("review")}
          disabled={wrongCount === 0}
        >
          <div className="card-icon">🔁</div>
          <h2>Review Wrong</h2>
          <p>Revisit and practice the questions you got wrong</p>

          {wrongCount > 0 ? (
            <div className="card-badge badge-red">
              {wrongCount} to review
            </div>
          ) : (
            <div className="card-badge badge-muted">
              Complete a test first
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

// --------------------------------------------------
// Select one week
// --------------------------------------------------

function WeekSelectScreen({ onBack, onSelect }) {
  const weeks = [
    ...new Set(questionsData.map((q) => q.week)),
  ].sort((a, b) => a - b);

  return (
    <div className="week-screen">
      <button className="back-btn" onClick={onBack}>
        ← Back
      </button>

      <h2 className="section-title">Select a Week</h2>

      <div className="week-grid">
        {weeks.map((week) => {
          const count = questionsData.filter(
            (q) => q.week === week
          ).length;

          return (
            <button
              key={week}
              className="week-card"
              onClick={() => onSelect(week)}
            >
              <span className="week-number">Week {week}</span>
              <span className="week-count">
                {count} questions
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --------------------------------------------------
// Select multiple weeks
// --------------------------------------------------

function MultiWeekSelectScreen({ onBack, onStart }) {
  const weeks = [
    ...new Set(questionsData.map((q) => q.week)),
  ].sort((a, b) => a - b);

  const minWeek = weeks[0];
  const maxWeek = weeks[weeks.length - 1];

  const [mode, setMode] = useState("pick");
  const [selected, setSelected] = useState(new Set());
  const [fromWeek, setFromWeek] = useState(minWeek);
  const [toWeek, setToWeek] = useState(maxWeek);

  const toggleWeek = (week) => {
    setSelected((prev) => {
      const next = new Set(prev);

      if (next.has(week)) {
        next.delete(week);
      } else {
        next.add(week);
      }

      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === weeks.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(weeks));
    }
  };

  const rangeWeeks = weeks.filter(
    (w) => w >= fromWeek && w <= toWeek
  );

  const activeWeeks =
    mode === "range" ? rangeWeeks : [...selected];

  const totalQuestions = questionsData.filter((q) =>
    activeWeeks.includes(q.week)
  ).length;

  return (
    <div className="week-screen">
      <button className="back-btn" onClick={onBack}>
        ← Back
      </button>

      <h2 className="section-title">Select Weeks</h2>
      <p className="section-subtitle">
        Pick individual weeks or a range
      </p>

      <div className="mode-toggle">
        <button
          className={`toggle-tab ${
            mode === "pick" ? "toggle-tab-active" : ""
          }`}
          onClick={() => setMode("pick")}
        >
          Pick Weeks
        </button>

        <button
          className={`toggle-tab ${
            mode === "range" ? "toggle-tab-active" : ""
          }`}
          onClick={() => setMode("range")}
        >
          From – To
        </button>
      </div>

      {mode === "pick" && (
        <>
          <div className="multi-controls">
            <button
              className="toggle-all-btn"
              onClick={toggleAll}
            >
              {selected.size === weeks.length
                ? "Deselect All"
                : "Select All"}
            </button>

            <span className="selection-summary">
              {selected.size === 0
                ? "No weeks selected"
                : `${selected.size} week${
                    selected.size > 1 ? "s" : ""
                  } · ${totalQuestions} questions`}
            </span>
          </div>

          <div className="week-grid">
            {weeks.map((week) => {
              const count = questionsData.filter(
                (q) => q.week === week
              ).length;

              const isSelected = selected.has(week);

              return (
                <button
                  key={week}
                  className={`week-card ${
                    isSelected ? "week-card-selected" : ""
                  }`}
                  onClick={() => toggleWeek(week)}
                >
                  <span className="week-check">
                    {isSelected ? "✓" : ""}
                  </span>

                  <span className="week-number">
                    Week {week}
                  </span>

                  <span className="week-count">
                    {count} questions
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {mode === "range" && (
        <div className="range-panel">
          <div className="range-row">
            <div className="range-field">
              <label className="range-label">From</label>

              <select
                className="range-select"
                value={fromWeek}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setFromWeek(value);

                  if (value > toWeek) {
                    setToWeek(value);
                  }
                }}
              >
                {weeks.map((w) => (
                  <option key={w} value={w}>
                    Week {w}
                  </option>
                ))}
              </select>
            </div>

            <div className="range-arrow">→</div>

            <div className="range-field">
              <label className="range-label">To</label>

              <select
                className="range-select"
                value={toWeek}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setToWeek(value);

                  if (value < fromWeek) {
                    setFromWeek(value);
                  }
                }}
              >
                {weeks.map((w) => (
                  <option key={w} value={w}>
                    Week {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="range-summary">
            <span className="range-summary-weeks">
              {rangeWeeks.length} weeks
            </span>
            <span className="range-summary-dot">·</span>
            <span>{totalQuestions} questions</span>
          </div>

          <div className="range-preview">
            {rangeWeeks.map((w) => (
              <span key={w} className="range-week-chip">
                W{w}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="multi-start-wrap">
        <button
          className="multi-start-btn"
          disabled={totalQuestions === 0}
          onClick={() => onStart(activeWeeks)}
        >
          {totalQuestions === 0
            ? "Select at least one week"
            : `Start Quiz · ${totalQuestions} Questions →`}
        </button>
      </div>
    </div>
  );
}

// --------------------------------------------------
// Quiz screen
// --------------------------------------------------

function QuizScreen({ questions, onFinish, onBack }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState([]);
  const [results, setResults] = useState([]);
  const [locked, setLocked] = useState(false);

  const q = questions[current];
  const total = questions.length;

  const isMulti = Array.isArray(q.answer);
  const correctAnswers = getCorrectAnswers(q);

  const progress = ((current + 1) / total) * 100;

  const finishAnswer = useCallback(
    (chosen) => {
      if (locked) return;

      setLocked(true);

      const correct = isAnswerCorrect(q, chosen);

      const result = {
        question: q,
        chosen: [...chosen],
        correct,
      };

      const newResults = [...results, result];

      setTimeout(() => {
        if (current + 1 < total) {
          setResults(newResults);
          setCurrent((c) => c + 1);
          setSelected([]);
          setLocked(false);
        } else {
          onFinish(newResults);
        }
      }, 1200);
    },
    [locked, q, results, current, total, onFinish]
  );

  const handleAnswer = (option) => {
    if (locked) return;

    if (isMulti) {
      setSelected((prev) =>
        prev.includes(option)
          ? prev.filter((item) => item !== option)
          : [...prev, option]
      );

      return;
    }

    const chosen = [option];
    setSelected(chosen);
    finishAnswer(chosen);
  };

  const submitMultiAnswer = () => {
    if (selected.length === 0 || locked) return;

    finishAnswer(selected);
  };

  const getOptionClass = (option) => {
    const isSelected = selected.includes(option);
    const isCorrect = correctAnswers.includes(option);

    if (!locked) {
      if (isSelected) {
        return "option-btn selected";
      }

      return "option-btn";
    }

    if (isCorrect) {
      return "option-btn correct";
    }

    if (isSelected) {
      return "option-btn wrong";
    }

    return "option-btn faded";
  };

  return (
    <div className="quiz-screen">
      <div className="quiz-header">
        <button className="back-btn" onClick={onBack}>
          ← Quit
        </button>

        <div className="quiz-counter">
          {current + 1} / {total}
        </div>
      </div>

      <div className="progress-bar-wrap">
        <div
          className="progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="question-card">
        <div className="question-num">Q{current + 1}</div>

        <p className="question-text">{q.question}</p>

        {isMulti && (
          <p className="section-subtitle">
            Select all correct answers.
          </p>
        )}
      </div>

      <div className="options-grid">
        {q.options.map((option, i) => {
          const isSelected = selected.includes(option);
          const isCorrect = correctAnswers.includes(option);

          return (
            <button
              key={i}
              className={getOptionClass(option)}
              onClick={() => handleAnswer(option)}
              disabled={locked}
            >
              <span className="opt-letter">
                {String.fromCharCode(65 + i)}
              </span>

              <span className="opt-text">{option}</span>

              {isMulti && !locked && isSelected && (
                <span className="opt-icon">✓</span>
              )}

              {locked && isCorrect && (
                <span className="opt-icon">✓</span>
              )}

              {locked && isSelected && !isCorrect && (
                <span className="opt-icon">✗</span>
              )}
            </button>
          );
        })}
      </div>

      {isMulti && !locked && (
        <button
          className="action-btn primary-btn"
          onClick={submitMultiAnswer}
          disabled={selected.length === 0}
        >
          Submit Answer ({selected.length} selected)
        </button>
      )}

      {locked && (
        <p className="next-hint">
          {isAnswerCorrect(q, selected)
            ? "✅ Correct!"
            : "❌ Wrong!"}{" "}
          Moving to next…
        </p>
      )}
    </div>
  );
}

// --------------------------------------------------
// Results screen
// --------------------------------------------------

function ResultsScreen({ results, onHome, onReview }) {
  const correct = results.filter((r) => r.correct).length;
  const wrong = results.filter((r) => !r.correct);

  const score = results.length
    ? Math.round((correct / results.length) * 100)
    : 0;

  const emoji =
    score >= 80
      ? "🏆"
      : score >= 60
      ? "👍"
      : score >= 40
      ? "🤔"
      : "💪";

  return (
    <div className="results-screen">
      <div className="score-hero">
        <div className="score-emoji">{emoji}</div>

        <div className="score-ring">
          <svg viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="52"
              className="ring-bg"
            />

            <circle
              cx="60"
              cy="60"
              r="52"
              className="ring-fill"
              strokeDasharray={`${(score / 100) * 326.7} 326.7`}
              strokeDashoffset="0"
            />
          </svg>

          <div className="score-text">
            <span className="score-num">{score}%</span>
            <span className="score-label">Score</span>
          </div>
        </div>

        <div className="score-stats">
          <div className="stat correct-stat">
            <span>{correct}</span> Correct
          </div>

          <div className="stat wrong-stat">
            <span>{wrong.length}</span> Wrong
          </div>
        </div>
      </div>

      {wrong.length > 0 && (
        <div className="wrong-review">
          <h3 className="review-heading">
            Questions You Missed
          </h3>

          {wrong.map((result, i) => {
            const correctAnswers = getCorrectAnswers(
              result.question
            );

            return (
              <div key={i} className="review-card">
                <p className="review-q">
                  {result.question.question}
                </p>

                <div className="review-options">
                  {result.question.options.map((option, j) => {
                    const isCorrect =
                      correctAnswers.includes(option);

                    const wasChosen =
                      result.chosen.includes(option);

                    let className = "rev-neutral";

                    if (isCorrect) {
                      className = "rev-correct";
                    } else if (wasChosen) {
                      className = "rev-wrong";
                    }

                    return (
                      <div
                        key={j}
                        className={`review-opt ${className}`}
                      >
                        <span className="rev-letter">
                          {String.fromCharCode(65 + j)}
                        </span>

                        <span>{option}</span>

                        {isCorrect && (
                          <span className="rev-tag">
                            ✓ Correct
                          </span>
                        )}

                        {wasChosen && !isCorrect && (
                          <span className="rev-tag">
                            ✗ Your answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <p className="review-q">
                  Your answer:{" "}
                  {result.chosen.length
                    ? result.chosen.join("; ")
                    : "No answer"}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="results-actions">
        <button
          className="action-btn primary-btn"
          onClick={onHome}
        >
          🏠 Home
        </button>

        {wrong.length > 0 && (
          <button
            className="action-btn secondary-btn"
            onClick={onReview}
          >
            🔁 Practice Wrong ({wrong.length})
          </button>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------
// Main app
// --------------------------------------------------

export default function App() {
  const [screen, setScreen] = useState(SCREEN.HOME);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizResults, setQuizResults] = useState([]);

  const [wrongQuestions, setWrongQuestions] = useState(() => {
    try {
      const saved = localStorage.getItem("nptel-wrong-questions");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(
      "nptel-wrong-questions",
      JSON.stringify(wrongQuestions)
    );
  }, [wrongQuestions]);

  const goHome = () => {
    setScreen(SCREEN.HOME);
  };

  const startQuiz = (questions) => {
    setQuizQuestions(prepareQuestions(questions));
    setQuizResults([]);
    setScreen(SCREEN.QUIZ);
  };

  const handleHomeSelect = (option) => {
    if (option === "week") {
      setScreen(SCREEN.WEEK_SELECT);
    } else if (option === "multi") {
      setScreen(SCREEN.MULTI_WEEK_SELECT);
    } else if (option === "full") {
      startQuiz(questionsData);
    } else if (option === "review") {
      startQuiz(wrongQuestions);
    }
  };

  const handleWeekSelect = (week) => {
    const weekQuestions = questionsData.filter(
      (q) => q.week === week
    );

    startQuiz(weekQuestions);
  };

  const handleMultiWeekStart = (selectedWeeks) => {
    const selectedQuestions = questionsData.filter((q) =>
      selectedWeeks.includes(q.week)
    );

    startQuiz(selectedQuestions);
  };

  const handleQuizFinish = (results) => {
    setQuizResults(results);

    const newlyWrong = results
      .filter((r) => !r.correct)
      .map((r) => r.question);

    const newlyCorrectIds = results
      .filter((r) => r.correct)
      .map((r) => r.question.id);

    setWrongQuestions((prev) => {
      const stillWrong = prev.filter(
        (q) => !newlyCorrectIds.includes(q.id)
      );

      const combined = [...stillWrong, ...newlyWrong];
      const seen = new Set();

      return combined.filter((q) => {
        if (seen.has(q.id)) return false;

        seen.add(q.id);
        return true;
      });
    });

    setScreen(SCREEN.RESULTS);
  };

  return (
    <div className="app">
      <div className="app-bg" />

      <div className="app-container">
        {screen === SCREEN.HOME && (
          <HomeScreen
            onSelect={handleHomeSelect}
            wrongCount={wrongQuestions.length}
          />
        )}

        {screen === SCREEN.WEEK_SELECT && (
          <WeekSelectScreen
            onBack={goHome}
            onSelect={handleWeekSelect}
          />
        )}

        {screen === SCREEN.MULTI_WEEK_SELECT && (
          <MultiWeekSelectScreen
            onBack={goHome}
            onStart={handleMultiWeekStart}
          />
        )}

        {screen === SCREEN.QUIZ && (
          <QuizScreen
            questions={quizQuestions}
            onFinish={handleQuizFinish}
            onBack={goHome}
          />
        )}

        {screen === SCREEN.RESULTS && (
          <ResultsScreen
            results={quizResults}
            onHome={goHome}
            onReview={() => startQuiz(wrongQuestions)}
          />
        )}
      </div>
    </div>
  );
}
