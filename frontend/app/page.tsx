import Link from 'next/link';
import { ArrowRight, Check, Download, FileText, LayoutTemplate, PenLine, ShieldCheck } from 'lucide-react';
import TemplateGallery from './components/TemplateGallery';
import HomepageHero from './components/HomepageHero';
import HomepageTools from './components/HomepageTools';
import HomepageExamples from './components/HomepageExamples';

const questions = [
  ['How do I create a resume?', 'Choose Create my resume to open the editor. Add your contact details, experience, education and skills, then choose a template. Preview each change as you go and download a copy when you’re ready.'],
  ['How do I choose a resume template?', 'Choose a layout that makes your own experience easy to follow. You can explore eight styles, change colors and adjust spacing in the editor. Switching a template keeps your content.'],
  ['Can I upload an existing resume?', 'Yes. Choose Upload my resume to open the import workspace. The main app supports PDF, DOCX, TXT and JSON backups when the document service is available. The browser workspace edition supports JSON backups. Review dates and sections after importing.'],
  ['What does the resume checker measure?', 'The checker offers Basic, ATS and Expert modes, with feedback on the criteria available for your document. You can add a job description to compare it with your experience. The result is a writing aid, not a guarantee of an employer’s decision.'],
  ['Can I create a matching cover letter?', 'Yes. The cover letter workspace guides you through your details, the recipient, the opportunity and your letter. Choose a style and preview your introduction as you write.'],
  ['Do I need an account?', 'You can start without an account. Your resumes, cover letters and job applications save in this browser. Account registration is not enabled in this version.'],
  ['What formats can I download?', 'The resume editor offers PDF printing, DOCX, TXT and editable JSON backups. Processing downloads depend on document service availability. Print / Save PDF keeps the design you see in the live preview.'],
  ['Can I tailor my resume for different jobs?', 'Yes. Duplicate your resume to create a separate version. Update the experience, skills and wording that matter for the next role, while keeping the original in your browser workspace.'],
  ['How do I keep my work safe?', 'Your drafts stay in this browser on this device. Download a JSON backup before clearing browser data or switching devices. Manage your documents in My workspace and read more in Privacy and data controls.'],
];

export default function Home() {
  return <main className="resume-home" id="top">
    <HomepageHero />
    <section className="home-benefits home-container" aria-label="A simpler way to build your resume">{[
      { icon: PenLine, title: 'A first draft made easier', text: 'A little structure. A lot more confidence.' },
      { icon: LayoutTemplate, title: 'A style for your story', text: 'Eight distinct layouts you can make your own.' },
      { icon: Download, title: 'Ready for your next move', text: 'Preview, download and take the next step.' },
      { icon: ShieldCheck, title: 'Your work, in your hands', text: 'Browser drafts and private backups.' },
    ].map(({ icon: Icon, title, text }) => <div className="home-benefit" key={title}><Icon size={26} strokeWidth={1.65} aria-hidden="true" /><h2>{title}</h2><p>{text}</p></div>)}</section>

    <HomepageTools />
    <section className="home-career-strip cf-container" aria-label="For every stage of your career"><p>For where you are. And where you’re going.</p><div><span>First job.</span><span>Fresh start.</span><span>Next chapter.</span><span>New direction.</span></div></section>
    <div className="home-template-section"><TemplateGallery variant="carousel" /></div>

    <section className="home-features cf-container" id="resume-features"><div className="home-section-heading"><h2>Way beyond a blank page.</h2><p>The right tools make your experience easier to put into words.</p></div><div className="home-feature-grid">
      <article className="home-feature-card home-feature-large"><div><span className="home-feature-tag">A clearer place to start</span><h3>A little guidance.<br />Every step of the way.</h3><p>Build your resume one section at a time. Add what matters, move things around and see the whole story come together.</p><Link className="home-text-link" href="/builder?new=1">Create my resume <ArrowRight size={18} /></Link></div><img src="/home/features/step-by-step.png" alt="Illustrative resume editor with section-by-section guidance" width="600" height="400" loading="lazy" /></article>
      <article className="home-feature-card home-feature-lavender"><span className="home-feature-tag">Your words, with a little support</span><h3>Find a stronger<br />way to say it.</h3><p>Use guided writing ideas to get started, then shape every line around your own experience.</p><img src="/home/features/summary.png" alt="Illustrative writing suggestions for a resume introduction" width="400" height="220" loading="lazy" /><Link className="home-text-link" href="/resources/guides">Explore writing guidance <ArrowRight size={18} /></Link></article>
      <article className="home-feature-card home-feature-mint"><span className="home-feature-tag">More than a resume</span><h3>A personal introduction<br />that opens the conversation.</h3><p>Connect the dots between your experience and the opportunity with a thoughtful cover letter.</p><img src="/home/features/cover-letter.png" alt="Illustrative cover letter draft and document details" width="400" height="220" loading="lazy" /><Link className="home-text-link" href="/cover-letter">Write my cover letter <ArrowRight size={18} /></Link></article>
      <article className="home-feature-card home-feature-blue"><span className="home-feature-tag">Make it relevant</span><h3>A fresh perspective<br />on your next application.</h3><p>Add a job description to the checker, review the feedback and focus your next edit on what matters.</p><img src="/home/features/job-match.png" alt="Illustrative job description and resume comparison" width="400" height="220" loading="lazy" /><Link className="home-text-link" href="/resume-scanner">Check my resume <ArrowRight size={18} /></Link></article>
      <article className="home-feature-card home-feature-last"><div className="home-organize-art" aria-hidden="true"><span><Check size={18} />Resume draft <small>Ready to review</small></span><span><FileText size={18} />Cover letter <small>Make it personal</small></span><span><Check size={18} />Next opportunity <small>Your next chapter</small></span></div><h3>A little less admin.<br />A little more momentum.</h3><p>Keep your documents, applications and next steps in a workspace you can return to.</p><Link className="home-text-link" href="/dashboard">Open my workspace <ArrowRight size={18} /></Link></article>
    </div></section>

    <HomepageExamples />
    <section className="home-confidence cf-container"><div className="home-section-heading"><h2>Make your next move<br />with a little more confidence.</h2><p>Useful tools, thoughtful details, and room to make it yours.</p></div><div className="home-confidence-grid">{[
      ['Your experience comes first', 'Keep your facts and your voice. Use the layout and writing prompts to present the experience you actually bring.', '/builder?new=1', 'Start my resume'],
      ['See the difference as you go', 'Every edit appears in the live preview. Try a new style, move a section and find a presentation that feels right.', '/templates', 'Explore the templates'],
      ['Keep a copy in your hands', 'Save browser drafts as you work, then download documents and editable backups for the next step in your application.', '/privacy', 'Understand browser storage'],
    ].map(([title, text, href, action]) => <article key={title}><span><Check size={20} /></span><h3>{title}</h3><p>{text}</p><Link className="home-text-link" href={href}>{action}<ArrowRight size={17} /></Link></article>)}</div></section>

    <section className="home-advice cf-container" id="career-advice"><div className="home-advice-heading"><h2>A little expert guidance<br />for your next draft.</h2><Link className="home-text-link" href="/resources/guides">Explore our writing guide <ArrowRight size={18} /></Link></div><div className="home-advice-grid"><Link className="home-advice-card" href="/resources/guides"><div className="home-advice-image"><img src="/home/resources/resume.png" alt="Resume writing guide illustration" width="600" height="340" loading="lazy" /></div><div><span>Resume writing</span><h3>How to turn your experience<br />into a clear, compelling resume.</h3><p>Start with the details that make your story yours.</p></div><ArrowRight size={21} /></Link><Link className="home-advice-card" href="/resources/guides#cover-letters"><div className="home-advice-image"><img src="/home/resources/cover-letter.png" alt="Cover letter writing guide illustration" width="600" height="340" loading="lazy" /></div><div><span>Cover letters</span><h3>A more personal introduction.<br />A stronger first connection.</h3><p>Find a starting point for what you want to say.</p></div><ArrowRight size={21} /></Link></div><div className="home-advice-links">{[['First application?', 'Start with what you’ve learned.', 'graduates'], ['A technical career?', 'Make your practical experience clear.', 'technical'], ['A new opportunity?', 'Focus on the details that fit.', 'tailor']].map(([title, text, id]) => <Link key={id} href={`/resources/guides#${id}`}><span>{title}</span><h3>{text}</h3><ArrowRight size={18} /></Link>)}</div></section>

    <section className="home-faq home-container" id="faq"><div className="home-section-heading"><h2>Frequently asked questions</h2></div><div className="home-faq-list">{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div><Link href="/resources/guides" className="home-text-link">Find more guidance for your next step <ArrowRight size={17} /></Link></section>
    <section className="home-full-cta"><div><p className="cf-eyebrow">Your next chapter starts here</p><h2>You bring the experience.<br /><span>Let’s tell your story.</span></h2><p>A great resume is only the beginning.</p><div className="home-hero-actions"><Link className="home-button home-button-primary" href="/builder?new=1">Create my resume</Link><Link className="home-button home-button-secondary" href="/builder?import=1">Upload my resume</Link></div></div><img src="/home/footer-resumes.png" alt="Illustrative career journey with a candidate and employer icons" width="700" height="480" loading="lazy" /></section>
  </main>;
}
