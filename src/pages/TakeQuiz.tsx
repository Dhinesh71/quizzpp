import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Quiz, Question } from '../types/database';
import LoadingSpinner from '../components/LoadingSpinner';
import { ChevronLeft, ChevronRight, Send, CheckCircle } from 'lucide-react';

const TakeQuiz: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (id) {
      fetchQuiz();
    }
  }, [id]);

  const fetchQuiz = async () => {
    try {
      // Fetch quiz
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (quizError) throw quizError;

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', id)
        .order('order_index');

      if (questionsError) throw questionsError;

      setQuiz(quizData);
      setQuestions(questionsData);
      setAnswers(new Array(questionsData.length).fill(''));
    } catch (error) {
      console.error('Error fetching quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].correct_answer) {
        correctAnswers++;
      }
    }
    return correctAnswers;
  };

  const handleSubmit = async () => {
    if (!studentName.trim() || !studentEmail.trim()) {
      alert('Please enter your name and email');
      return;
    }

    if (answers.some(answer => !answer.trim())) {
      alert('Please answer all questions before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const calculatedScore = calculateScore();
      
      const { error } = await supabase
        .from('responses')
        .insert({
          quiz_id: id!,
          student_name: studentName.trim(),
          student_email: studentEmail.trim(),
          answers,
          score: calculatedScore,
          total_questions: questions.length
        });

      if (error) throw error;

      setScore(calculatedScore);
      setSubmitted(true);
      setShowResults(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return <Navigate to="/" replace />;
  }

  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="mb-8">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Completed!</h1>
              <p className="text-gray-600 text-lg">Thank you for taking the quiz, {studentName}!</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-8 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{score}</div>
                  <div className="text-gray-600">Correct Answers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{questions.length}</div>
                  <div className="text-gray-600">Total Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600 mb-2">{percentage}%</div>
                  <div className="text-gray-600">Score</div>
                </div>
              </div>
            </div>

            <div className="border-t pt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Your Answers</h2>
              <div className="space-y-6 text-left">
                {questions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">
                      {index + 1}. {question.question_text}
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Your answer:</span>
                        <span className={`text-sm font-medium ${
                          answers[index] === question.correct_answer 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {answers[index]}
                          {answers[index] === question.correct_answer ? ' ✓' : ' ✗'}
                        </span>
                      </div>
                      
                      {answers[index] !== question.correct_answer && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Correct answer:</span>
                          <span className="text-sm font-medium text-green-600">
                            {question.correct_answer}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Quiz Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-gray-600 text-lg leading-relaxed mb-6">{quiz.description}</p>
          )}
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{currentQuestion + 1} of {questions.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Student Info (only on first question) */}
          {currentQuestion === 0 && !submitted && (
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="block w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="block w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Current Question */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            {currentQuestion + 1}. {questions[currentQuestion].question_text}
          </h2>
          
          <div className="space-y-4">
            {questions[currentQuestion].options.map((option, optionIndex) => (
              <label
                key={optionIndex}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all duration-200"
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion}`}
                  value={option}
                  checked={answers[currentQuestion] === option}
                  onChange={() => handleAnswerChange(option)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-4 text-gray-900 text-lg">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={previousQuestion}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Previous
          </button>

          <div className="flex gap-4">
            {currentQuestion === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting || !answers[currentQuestion] || !studentName.trim() || !studentEmail.trim()}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                {submitting ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                disabled={!answers[currentQuestion]}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Next
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeQuiz;