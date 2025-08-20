import React, { useState } from 'react';
import {
  QuestionMarkCircleIcon,
  PlusIcon,
  HandThumbUpIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import {
  HandThumbUpIcon as HandThumbUpIconSolid,
} from '@heroicons/react/24/solid';
import { Question, Answer } from '../types';

// Empty array - questions will be loaded from Firebase
const mockQuestions: Question[] = [];

const categories = ['All', 'Policy', 'Clinical', 'Communication', 'Equipment', 'Scheduling', 'Safety', 'Training'];

export default function QA() {
  const [questions] = useState<Question[]>(mockQuestions);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filter, setFilter] = useState<'all' | 'answered' | 'unanswered' | 'my-questions'>('all');
  const [showAskQuestion, setShowAskQuestion] = useState(false);
  const [upvotedItems, setUpvotedItems] = useState<Set<string>>(new Set());

  const [newQuestion, setNewQuestion] = useState({
    title: '',
    content: '',
    category: 'General',
    tags: '',
    isAnonymous: false
  });

  const filteredQuestions = questions
    .filter(question => {
      const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           question.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           question.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || question.category === selectedCategory;
      const matchesFilter = 
        filter === 'all' ? true :
        filter === 'answered' ? question.isAnswered :
        filter === 'unanswered' ? !question.isAnswered :
        filter === 'my-questions' ? question.author === 'current-user' :
        true;
      
      return matchesSearch && matchesCategory && matchesFilter;
    })
    .sort((a, b) => {
      // Sort by creation date, newest first
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

  const handleUpvote = (type: 'question' | 'answer', id: string) => {
    const key = `${type}-${id}`;
    const newUpvoted = new Set(upvotedItems);
    if (newUpvoted.has(key)) {
      newUpvoted.delete(key);
    } else {
      newUpvoted.add(key);
    }
    setUpvotedItems(newUpvoted);
  };

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would submit to the backend
    console.log('Submitting question:', newQuestion);
    setShowAskQuestion(false);
    setNewQuestion({
      title: '',
      content: '',
      category: 'General',
      tags: '',
      isAnonymous: false
    });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

    if (diffDays === 0) {
      if (diffHours === 0) return 'Just now';
      if (diffHours === 1) return '1 hour ago';
      return `${diffHours} hours ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const unansweredCount = questions.filter(q => !q.isAnswered).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Q&A Community</h1>
          <p className="text-lg text-gray-600">
            Ask questions, share knowledge, and get help from your colleagues
            {unansweredCount > 0 && (
              <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-accent-100 text-accent-700">
                {unansweredCount} need answers
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowAskQuestion(true)}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <PlusIcon className="h-5 w-5" />
          Ask Question
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col space-y-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search questions and answers..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
              >
                <option value="all">All Questions</option>
                <option value="answered">Answered ({questions.filter(q => q.isAnswered).length})</option>
                <option value="unanswered">Needs Answers ({unansweredCount})</option>
                <option value="my-questions">My Questions</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Ask Question Modal */}
      {showAskQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Ask a Question</h2>
              <form onSubmit={handleSubmitQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Question Title</label>
                  <input
                    type="text"
                    value={newQuestion.title}
                    onChange={(e) => setNewQuestion({...newQuestion, title: e.target.value})}
                    placeholder="What's your question?"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Question Details</label>
                  <textarea
                    value={newQuestion.content}
                    onChange={(e) => setNewQuestion({...newQuestion, content: e.target.value})}
                    placeholder="Provide more details about your question..."
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                    required
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <select
                      value={newQuestion.category}
                      onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                    >
                      {categories.slice(1).map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={newQuestion.tags}
                      onChange={(e) => setNewQuestion({...newQuestion, tags: e.target.value})}
                      placeholder="tag1, tag2, tag3"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={newQuestion.isAnonymous}
                    onChange={(e) => setNewQuestion({...newQuestion, isAnonymous: e.target.checked})}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
                    Ask anonymously
                  </label>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAskQuestion(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Post Question
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-6">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((question) => {
            const questionUpvoted = upvotedItems.has(`question-${question.id}`);
            
            return (
              <div key={question.id} className="card hover:shadow-lg transition-shadow">
                {/* Question Header */}
                <div className="flex items-start gap-4 mb-4">
                  <button
                    onClick={() => handleUpvote('question', question.id)}
                    className="flex flex-col items-center space-y-1 flex-shrink-0"
                  >
                    {questionUpvoted ? (
                      <HandThumbUpIconSolid className="h-6 w-6 text-primary-600" />
                    ) : (
                      <HandThumbUpIcon className="h-6 w-6 text-gray-400 hover:text-primary-600" />
                    )}
                    <span className={`text-sm font-semibold ${
                      questionUpvoted ? 'text-primary-600' : 'text-gray-600'
                    }`}>
                      {question.upvotes + (questionUpvoted ? 1 : 0)}
                    </span>
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 leading-tight">{question.title}</h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {question.isAnswered ? (
                          <div className="flex items-center gap-1 px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-semibold">
                            <CheckCircleIcon className="h-4 w-4" />
                            Answered
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-3 py-1 bg-accent-100 text-accent-700 rounded-full text-sm font-semibold">
                            <ClockIcon className="h-4 w-4" />
                            Needs Answer
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <UserCircleIcon className="h-4 w-4" />
                        <span>{question.authorName}</span>
                      </div>
                      <span>{formatDate(question.createdAt)}</span>
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                        {question.category}
                      </span>
                    </div>
                    
                    <p className="text-gray-800 leading-relaxed mb-4">{question.content}</p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {question.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    
                    {/* Answer Count */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <ChatBubbleLeftRightIcon className="h-4 w-4" />
                        <span>{question.answers.length} {question.answers.length === 1 ? 'answer' : 'answers'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Answers */}
                {question.answers.length > 0 && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      {question.answers.length === 1 ? 'Answer' : 'Answers'}
                    </h4>
                    <div className="space-y-4">
                      {question.answers.map((answer) => {
                        const answerUpvoted = upvotedItems.has(`answer-${answer.id}`);
                        
                        return (
                          <div key={answer.id} className={`flex items-start gap-4 p-4 rounded-lg ${
                            answer.isAccepted ? 'bg-secondary-50 border border-secondary-200' : 'bg-gray-50'
                          }`}>
                            <button
                              onClick={() => handleUpvote('answer', answer.id)}
                              className="flex flex-col items-center space-y-1 flex-shrink-0"
                            >
                              {answerUpvoted ? (
                                <HandThumbUpIconSolid className="h-5 w-5 text-primary-600" />
                              ) : (
                                <HandThumbUpIcon className="h-5 w-5 text-gray-400 hover:text-primary-600" />
                              )}
                              <span className={`text-xs font-semibold ${
                                answerUpvoted ? 'text-primary-600' : 'text-gray-600'
                              }`}>
                                {answer.upvotes + (answerUpvoted ? 1 : 0)}
                              </span>
                            </button>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <UserCircleIcon className="h-4 w-4" />
                                  <span className="font-semibold">{answer.authorName}</span>
                                </div>
                                <span className="text-sm text-gray-500">{formatDate(answer.createdAt)}</span>
                                {answer.isAccepted && (
                                  <div className="flex items-center gap-1 px-2 py-1 bg-secondary-200 text-secondary-800 rounded-full text-xs font-semibold">
                                    <CheckCircleIcon className="h-3 w-3" />
                                    Best Answer
                                  </div>
                                )}
                              </div>
                              <p className="text-gray-800 leading-relaxed">{answer.content}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="card text-center py-12">
            <QuestionMarkCircleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No questions found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== 'All' || filter !== 'all'
                ? 'Try adjusting your search terms or filters.'
                : 'Be the first to ask a question in the community!'}
            </p>
            <button
              onClick={() => setShowAskQuestion(true)}
              className="btn-primary"
            >
              Ask the First Question
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
