"use client";

import { Fragment } from "react";
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

type MetricRow = { label: string; value: string | undefined };

function measuredNumber(value: unknown, decimals = 0, suffix = ""): string | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? `${value.toFixed(decimals)}${suffix}` : undefined;
}

function measuredBoolean(value: unknown): string | undefined {
  return typeof value === "boolean" ? (value ? "Yes" : "No") : undefined;
}

export default function ScoreBreakdown({ score }: ScoreBreakdownProps) {
  const breakdownItems = [
    { label: "ATS Compliance", score: score.ats_compliance },
    { label: "Readability", score: score.readability },
    { label: "Layout", score: score.layout },
    { label: "Experience", score: score.experience },
    { label: "Skills", score: score.skills },
    { label: "Job Match", score: score.job_match },
  ].filter((item): item is { label: string; score: number } =>
    typeof item.score === "number" && Number.isFinite(item.score));

  // The API supplies different analyses by scan mode. Missing measurements
  // are omitted, while measured zero values and false flags remain visible.
  const metrics = score.detailed_metrics;
  const metricGroups: { title: string; rows: MetricRow[] }[] = [
    { title: "Readability", rows: [
      { label: "Flesch Reading Ease", value: measuredNumber(metrics?.readability?.flesch_reading_ease, 1) },
      { label: "Flesch-Kincaid Grade", value: measuredNumber(metrics?.readability?.flesch_kincaid_grade, 1) },
      { label: "Avg Words/Sentence", value: measuredNumber(metrics?.readability?.avg_words_per_sentence, 1, " words") },
    ] },
    { title: "Structure", rows: [
      { label: "Has Contact Info", value: measuredBoolean(metrics?.structure?.has_contact) },
      { label: "Has Summary", value: measuredBoolean(metrics?.structure?.has_summary) },
      { label: "Has Experience", value: measuredBoolean(metrics?.structure?.has_experience) },
      { label: "Has Education", value: measuredBoolean(metrics?.structure?.has_education) },
      { label: "Has Skills", value: measuredBoolean(metrics?.structure?.has_skills) },
    ] },
    { title: "Experience", rows: [
      { label: "Total Roles", value: measuredNumber(metrics?.experience?.total_roles) },
      { label: "Avg Bullets/Role", value: measuredNumber(metrics?.experience?.avg_bullets_per_role, 1) },
      { label: "Quantified Achievements", value: measuredNumber(metrics?.experience?.quantified_achievements) },
      { label: "Quantification Rate", value: measuredNumber(metrics?.experience?.quantification_rate, 1, "%") },
    ] },
    { title: "Skills", rows: [
      { label: "Total Skills", value: measuredNumber(metrics?.skills?.total_skills) },
      { label: "Categorized Skills", value: measuredNumber(metrics?.skills?.categorized_skills) },
      { label: "Unique Categories", value: measuredNumber(metrics?.skills?.unique_categories) },
    ] },
    { title: "Layout", rows: [
      { label: "Word Count", value: measuredNumber(metrics?.layout?.word_count) },
      { label: "Estimated Pages", value: measuredNumber(metrics?.layout?.estimated_pages, 1) },
    ] },
  ].map(group => ({ ...group, rows: group.rows.filter(row => row.value !== undefined) }))
    .filter(group => group.rows.length > 0);

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

      {/* Only display analyses and measurements returned by this scan. */}
      {metricGroups.length > 0 && (
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
              {metricGroups.map(group => (
                <div key={group.title} className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-700 mb-2">{group.title}</h5>
                  <div className="grid grid-cols-2 gap-2 text-gray-600">
                    {group.rows.map(row => (
                      <Fragment key={row.label}>
                        <span>{row.label}:</span>
                        <span className="font-medium">{row.value}</span>
                      </Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
