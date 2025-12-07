"use client";

import { ResumeScore } from "@/lib/types";

interface ScoreBreakdownProps {
  score: ResumeScore;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-green-100";
  if (score >= 60) return "bg-yellow-100";
  if (score >= 40) return "bg-orange-100";
  return "bg-red-100";
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 50) return "Needs Work";
  return "Poor";
}

interface ScoreBarProps {
  label: string;
  score: number;
  maxScore?: number;
}

function ScoreBar({ label, score, maxScore = 100 }: ScoreBarProps) {
  const percentage = Math.min((score / maxScore) * 100, 100);
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
          {score.toFixed(0)}/{maxScore}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(score)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function ScoreBreakdown({ score }: ScoreBreakdownProps) {
  const breakdownItems = [
    { label: "Readability", score: score.readability.readability_score },
    { label: "Structure", score: score.structure.structure_score },
    { label: "Experience", score: score.experience.experience_score },
    { label: "Skills", score: score.skills.skills_score },
    { label: "Length", score: score.length.length_score },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      {/* Overall Score */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Resume Score</h3>
        <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBgColor(score.overall)}`}>
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(score.overall)}`}>
              {score.overall}
            </div>
            <div className="text-sm text-gray-500">out of 100</div>
          </div>
        </div>
        <p className={`mt-2 text-lg font-medium ${getScoreColor(score.overall)}`}>
          {getScoreLabel(score.overall)}
        </p>
      </div>

      {/* Score Breakdown */}
      <div className="border-t pt-6">
        <h4 className="text-md font-semibold text-gray-700 mb-4">Score Breakdown</h4>
        <div className="space-y-4">
          {breakdownItems.map((item) => (
            <ScoreBar
              key={item.label}
              label={item.label}
              score={item.score}
            />
          ))}
        </div>
      </div>

      {/* Comments */}
      {score.comments && score.comments.length > 0 && (
        <div className="border-t pt-6">
          <h4 className="text-md font-semibold text-gray-700 mb-3">
            Feedback & Suggestions
          </h4>
          <ul className="space-y-2">
            {score.comments.map((comment, index) => (
              <li key={index} className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm text-gray-600">{comment}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed Metrics Accordion */}
      <div className="border-t pt-6">
        <details className="group">
          <summary className="flex justify-between items-center cursor-pointer list-none">
            <h4 className="text-md font-semibold text-gray-700">
              Detailed Metrics
            </h4>
            <svg
              className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </summary>
          
          <div className="mt-4 space-y-4 text-sm">
            {/* Readability Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-700 mb-2">Readability</h5>
              <div className="grid grid-cols-2 gap-2 text-gray-600">
                <span>Flesch Reading Ease:</span>
                <span className="font-medium">{score.readability.flesch_reading_ease.toFixed(1)}</span>
                <span>Flesch-Kincaid Grade:</span>
                <span className="font-medium">{score.readability.flesch_kincaid_grade.toFixed(1)}</span>
                <span>Avg Words/Sentence:</span>
                <span className="font-medium">{score.readability.avg_words_per_sentence.toFixed(1)} words</span>
              </div>
            </div>

            {/* Structure Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-700 mb-2">Structure</h5>
              <div className="grid grid-cols-2 gap-2 text-gray-600">
                <span>Sections Found:</span>
                <span className="font-medium">{score.structure.section_count}</span>
                <span>Has Contact Info:</span>
                <span className="font-medium">{score.structure.has_contact ? "Yes" : "No"}</span>
                <span>Has Experience:</span>
                <span className="font-medium">{score.structure.has_experience ? "Yes" : "No"}</span>
                <span>Has Education:</span>
                <span className="font-medium">{score.structure.has_education ? "Yes" : "No"}</span>
                <span>Has Skills:</span>
                <span className="font-medium">{score.structure.has_skills ? "Yes" : "No"}</span>
              </div>
            </div>

            {/* Experience Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-700 mb-2">Experience</h5>
              <div className="grid grid-cols-2 gap-2 text-gray-600">
                <span>Total Roles:</span>
                <span className="font-medium">{score.experience.total_roles}</span>
                <span>Avg Bullets/Role:</span>
                <span className="font-medium">{score.experience.avg_bullets_per_role.toFixed(1)}</span>
                <span>Quantified Achievements:</span>
                <span className="font-medium">{score.experience.quantified_achievements}</span>
                <span>Quantification Rate:</span>
                <span className="font-medium">{score.experience.quantification_rate.toFixed(1)}%</span>
              </div>
            </div>

            {/* Skills Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-700 mb-2">Skills</h5>
              <div className="grid grid-cols-2 gap-2 text-gray-600">
                <span>Total Skills:</span>
                <span className="font-medium">{score.skills.total_skills}</span>
                <span>Categorized Skills:</span>
                <span className="font-medium">{score.skills.categorized_skills}</span>
                <span>Unique Categories:</span>
                <span className="font-medium">{score.skills.unique_categories}</span>
              </div>
            </div>

            {/* Length Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-700 mb-2">Length</h5>
              <div className="grid grid-cols-2 gap-2 text-gray-600">
                <span>Word Count:</span>
                <span className="font-medium">{score.length.word_count}</span>
                <span>Estimated Pages:</span>
                <span className="font-medium">{score.length.estimated_pages.toFixed(1)}</span>
                <span>Length Status:</span>
                <span className="font-medium">{score.length.is_too_short ? "Too Short" : score.length.is_too_long ? "Too Long" : "Optimal"}</span>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
