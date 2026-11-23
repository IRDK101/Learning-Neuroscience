import { Syllabus } from '../../ui/Syllabus';

export function LearnPage() {
  return (
    <div>
      <div className="page-head">
        <h1>The course, in order</h1>
        <p>
          Three parts, one for each exam: how neurons and the brain are built and signal, then the senses and movement, then emotion,
          memory and the rest. Each lesson takes 5 to 10 minutes. Its diagrams light up as you read, and a few questions check you've
          got it.
        </p>
      </div>
      <Syllabus detailed />
    </div>
  );
}
