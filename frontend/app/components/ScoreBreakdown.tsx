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
  // Build breakdown items from the new flat score structure
  const breakdownItems: { label: string; score: number }[] = [
    { label: "ATS Compliance", score: score.ats_compliance },
    { label: "Readability", score: score.readability },
    { label: "Layout", score: score.layout },
  ];
  
  // Add experience and skills only if available (not null in basic mode)
  if (score.experience !== null) {
    breakdownItems.push({ label: "Experience", score: score.experience });
  }
  if (score.skills !== null) {
    breakdownItems.push({ label: "Skills", score: score.skills });
  }
  if (score.job_match !== null && score.job_match !== undefined) {
    breakdownItems.push({ label: "Job Match", score: score.job_match });
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      {/* Overall Score */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Resume Score</h3>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
            score.mode === 'expert' ? 'bg-purple-100 text-purple-700' :
            score.mode === 'ats' ? 'bg-teal-100 text-teal-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {score.mode === 'expert' ? 'Expert' : score.mode === 'ats' ? 'ATS Pro' : 'Basic'}
          </span>
        </div>
        <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBgColor(score.overall)}`}>
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(score.overall)}`}>
              {Math.round(score.overall)}
            </div>
            <div className="text-sm text-gray-500">out of 100</div>
          </div>
        </div>
        <p className={`mt-2 text-lg font-medium ${getScoreColor(score.overall)}`}>
          {getScoreLabel(score.overall)}
        </p>
      </div>

      {/* Flags/Warnings */}
      {score.flags && score.flags.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-md font-semibold text-red-700 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Important Flags
          </h4>
          <ul className="space-y-1">
            {score.flags.map((flag, index) => (
              <li key={index} className="text-sm text-red-600 flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

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

      {/* Detailed Metrics Accordion - Only show if detailed_metrics exists */}
      {score.detailed_metrics && (
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
                  <span className="font-medium">{score.detailed_metrics.readability.flesch_reading_ease.toFixed(1)}</span>
                  <span>Flesch-Kincaid Grade:</span>
                  <span className="font-medium">{score.detailed_metrics.readability.flesch_kincaid_grade.toFixed(1)}</span>
                  <span>Avg Words/Sentence:</span>
                  <span className="font-medium">{score.detailed_metrics.readability.avg_words_per_sentence.toFixed(1)} words</span>
                </div>
              </div>

              {/* Structure Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-700 mb-2">Structure</h5>
                <div className="grid grid-cols-2 gap-2 text-gray-600">
                  <span>Sections Found:</span>
                  <span className="font-medium">{score.detailed_metrics.structure.section_count}</span>
                  <span>Has Contact Info:</span>
                  <span className="font-medium">{score.detailed_metrics.structure.has_contact ? "Yes" : "No"}</span>
                  <span>Has Experience:</span>
                  <span className="font-medium">{score.detailed_metrics.structure.has_experience ? "Yes" : "No"}</span>
                  <span>Has Education:</span>
                  <span className="font-medium">{score.detailed_metrics.structure.has_education ? "Yes" : "No"}</span>
                  <span>Has Skills:</span>
                  <span className="font-medium">{score.detailed_metrics.structure.has_skills ? "Yes" : "No"}</span>
                </div>
              </div>

              {/* Experience Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-700 mb-2">Experience</h5>
                <div className="grid grid-cols-2 gap-2 text-gray-600">
                  <span>Total Roles:</span>
                  <span className="font-medium">{score.detailed_metrics.experience.total_roles}</span>
                  <span>Avg Bullets/Role:</span>
                  <span className="font-medium">{score.detailed_metrics.experience.avg_bullets_per_role.toFixed(1)}</span>
                  <span>Quantified Achievements:</span>
                  <span className="font-medium">{score.detailed_metrics.experience.quantified_achievements}</span>
                  <span>Quantification Rate:</span>
                  <span className="font-medium">{score.detailed_metrics.experience.quantification_rate.toFixed(1)}%</span>
                </div>
              </div>

              {/* Skills Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-700 mb-2">Skills</h5>
                <div className="grid grid-cols-2 gap-2 text-gray-600">
                  <span>Total Skills:</span>
                  <span className="font-medium">{score.detailed_metrics.skills.total_skills}</span>
                  <span>Categorized Skills:</span>
                  <span className="font-medium">{score.detailed_metrics.skills.categorized_skills}</span>
                  <span>Unique Categories:</span>
                  <span className="font-medium">{score.detailed_metrics.skills.unique_categories}</span>
                </div>
              </div>

              {/* Length Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-700 mb-2">Length</h5>
                <div className="grid grid-cols-2 gap-2 text-gray-600">
                  <span>Word Count:</span>
                  <span className="font-medium">{score.detailed_metrics.length.word_count}</span>
                  <span>Estimated Pages:</span>
                  <span className="font-medium">{score.detailed_metrics.length.estimated_pages.toFixed(1)}</span>
                  <span>Length Status:</span>
                  <span className="font-medium">
                    {score.detailed_metrics.length.is_too_short 
                      ? "Too Short" 
                      : score.detailed_metrics.length.is_too_long 
                      ? "Too Long" 
                      : "Optimal"}
                  </span>
                </div>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
