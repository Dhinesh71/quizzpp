import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Question } from '../types/database';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Trash2, MoveUp, MoveDown, Save, Eye } from 'lucide-react';

const CreateQuiz: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Omit<Question, 'id' | 'quiz_id'>[]>([
    {
      question_text: '',
      options: ['', ''],
      correct_answer: '',
      order_index: 0
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        options: ['', ''],
        correct_answer: '',
        order_index: questions.length
      }
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) return;
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions.map((q, i) => ({ ...q, order_index: i })));
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= newQuestions.length) return;
    
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    setQuestions(newQuestions.map((q, i) => ({ ...q, order_index: i })));
  };

  const updateQuestion = (index: number, field: keyof Omit<Question, 'id' | 'quiz_id'>, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const addOption = (questionIndex: number) => {
    if (questions[questionIndex].options.length >= 5) return;
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push('');
    setQuestions(newQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    if (questions[questionIndex].options.length <= 2) return;
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.splice(optionIndex, 1);
    // Clear correct answer if it was the removed option
    if (newQuestions[questionIndex].correct_answer === questions[questionIndex].options[optionIndex]) {
      newQuestions[questionIndex].correct_answer = '';
    }
    setQuestions(newQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const validateForm = () => {
    if (!title.trim()) {
      alert('Please enter a quiz title');
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      if (!question.question_text.trim()) {
        alert(`Please enter text for question ${i + 1}`);
        return false;
      }

      if (question.options.some(option => !option.trim())) {
        alert(`Please fill in all options for question ${i + 1}`);
        return false;
      }

      if (!question.correct_answer.trim()) {
        alert(`Please select a correct answer for question ${i + 1}`);
        return false;
      }

      if (!question.options.includes(question.correct_answer)) {
        alert(`The correct answer for question ${i + 1} must be one of the provided options`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !user) return;

    setLoading(true);
    try {
      // Create quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          created_by: user.id,
          is_active: true
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Create questions
      const questionsToInsert = questions.map((question) => ({
        quiz_id: quiz.id,
        question_text: question.question_text.trim(),
        options: question.options.map(opt => opt.trim()),
        correct_answer: question.correct_answer.trim(),
        order_index: question.order_index
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Failed to create quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (previewMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Quiz Preview</h1>
            <button
              onClick={() => setPreviewMode(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Back to Edit
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
            {description && (
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">{description}</p>
            )}

            <div className="space-y-8">
              {questions.map((question, index) => (
                <div key={index} className="border-b border-gray-200 pb-8 last:border-b-0">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {index + 1}. {question.question_text}
                  </h3>
                  
                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="radio"
                          name={`preview-question-${index}`}
                          value={option}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-3 text-gray-900">{option}</span>
                        {option === question.correct_answer && (
                          <span className="ml-auto text-green-600 text-sm font-medium">✓ Correct</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Quiz</h1>
          <p className="text-gray-600 mt-2">Build your quiz with multiple choice questions</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Quiz Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Quiz Details</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your quiz title"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="Provide instructions or context for your quiz"
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {questions.map((question, questionIndex) => (
              <div key={questionIndex} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Question {questionIndex + 1}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {questions.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => moveQuestion(questionIndex, 'up')}
                          disabled={questionIndex === 0}
                          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Move up"
                        >
                          <MoveUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveQuestion(questionIndex, 'down')}
                          disabled={questionIndex === questions.length - 1}
                          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Move down"
                        >
                          <MoveDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeQuestion(questionIndex)}
                          className="p-2 text-red-400 hover:text-red-600 transition-colors"
                          title="Delete question"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Question Text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Text *
                    </label>
                    <textarea
                      rows={2}
                      value={question.question_text}
                      onChange={(e) => updateQuestion(questionIndex, 'question_text', e.target.value)}
                      className="block w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                      placeholder="Enter your question"
                      required
                    />
                  </div>

                  {/* Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Answer Options * (Select the correct answer)
                    </label>
                    <div className="space-y-3">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name={`correct-${questionIndex}`}
                            checked={question.correct_answer === option}
                            onChange={() => updateQuestion(questionIndex, 'correct_answer', option)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder={`Option ${optionIndex + 1}`}
                            required
                          />
                          {question.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(questionIndex, optionIndex)}
                              className="p-2 text-red-400 hover:text-red-600 transition-colors"
                              title="Remove option"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {question.options.length < 5 && (
                      <button
                        type="button"
                        onClick={() => addOption(questionIndex)}
                        className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Add Option
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Question Button */}
          <div className="text-center">
            <button
              type="button"
              onClick={addQuestion}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="h-5 w-5" />
              Add Question
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              onClick={() => setPreviewMode(true)}
              disabled={!title.trim() || questions.some(q => !q.question_text.trim())}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Eye className="h-5 w-5" />
              Preview Quiz
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <LoadingSpinner size="small" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {loading ? 'Creating...' : 'Create Quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateQuiz;