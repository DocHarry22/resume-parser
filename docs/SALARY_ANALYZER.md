# Salary Analyzer

19 October 2026. Local implementation in `.mission-work`, route `/salary-analyzer`, available from workspace navigation and each saved job's **Analyze salary** link.

The analyzer compares the user's own offers. A tracker link selects the saved opportunity and displays its original salary text. The user chooses an amount, currency and pay period; ranges, missing periods and cost-to-company packages are not automatically interpreted. Saving, copying or deleting scenarios does not modify source jobs or application documents.

Monthly, annual, weekly, every-two-weeks and hourly pay normalize to annual base pay. Weekly/hourly calculations assume 52 paid weeks; every-two-weeks means 26 payments. Hourly scenarios have editable weekly hours. An annual cash bonus is added once. Figures exclude employer-paid benefits and equity.

Up to 20 scenarios persist locally. The comparison groups ZAR, USD, EUR, GBP, CAD and AUD separately, with a selectable baseline per currency. There is no currency conversion, market survey or recommendation that the highest gross salary is the best offer. Differences are annual gross amounts and percentages; a zero baseline has no percentage.

## Take-home assumptions

The default is gross pay only: unknown take-home remains unknown. Manual mode uses the user's total monthly deductions, including all taxes; nothing is added automatically. Monthly work costs are subtracted from estimated take-home, with negative remaining budgets retained.

The optional South African mode is explicitly labelled **2026/27, 1 March 2026–28 February 2027**. It applies published annual individual tax brackets and age rebates to annual cash income, then subtracts employee UIF if selected and the user's other cash deductions. These extra deductions do not reduce taxable income. The model assumes a single full-year employment income, evenly paid base salary and an annual bonus paid in one month. Monthly results are annual averages including that bonus. Medical scheme credits, retirement deductions, travel allowances, other income and special payroll arrangements are outside this simplified estimate. Actual withholding can differ. The UI links to the sources and marks the rates historical after the tax year ends.

Official sources checked on 19 October 2026:

- [SARS individual tax rates, rebates and thresholds](https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/).
- [SARS employee UIF contribution and earnings cap](https://www.sars.gov.za/types-of-tax/unemployment-insurance-fund/).

Source facts are implemented as versioned local calculations; salary inputs are not sent to SARS or any third party. Planning estimates are not payslips or tax assessments.

## Persistence and exports

Scenarios use `resume-studio.salary-scenarios.v1`. Each update rereads storage and checks a unique revision; another tab's newer work cannot be overwritten by a stale editor. Unsaved form values remain when persistence fails. Corrupt storage is retained and writes are disabled. Validation bounds names, notes, amounts, currencies, pay periods, metadata and scenario count. Source jobs remain untouched.

CSV contains the actual inputs, annual figures, known deduction estimates, work costs, tax year and advertised salary/notes. Unknown estimates are blank. Text that could become spreadsheet formulas is neutralized. Calculations and saved data stay in this browser; the CSV is a local download.

## Verification

`npm test` passed 93 tests plus existing career-workspace and genuine DOCX checks. Twelve salary tests cover period conversion, bonus accounting, every tax bracket boundary and all age thresholds, UIF and its bonus-month cap, manual deductions and negative budgets, currency separation, invalid input, concurrent updates, corruption/quota/capacity, and CSV contents/formula protection.

`npm run test:salary` checks the running preview through Edge with synthetic jobs and no external salary requests. Reports and screenshots are in `docs/qa/salary-analyzer/`. The production preview uses `NEXT_PUBLIC_STORAGE_MODE=local` and `NEXT_DIST_DIR=.next-salary-release`.

The production build and TypeScript checks passed for all 25 pages. Six [salary browser checks](qa/salary-analyzer/report.json) passed: saved-job context and actual displayed tax/net figures, hourly/manual scenarios and currency separation, persistence/copies/baselines/CSV/removal, stale edits across two tabs, quota/corrupt-data preservation, and 390 px layout/navigation. Browser checks observed no external salary requests.

Eight [tracker regression checks](qa/salary-analyzer/tracker-regression/report.json) also passed, including document links, stages, follow-ups/calendar, exports/backups, corruption/quota and concurrent edits, and desktop/phone layouts.

This increment has not been published to the live website.
