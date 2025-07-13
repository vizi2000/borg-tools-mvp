import { NextRequest, NextResponse } from 'next/server';
import { jobs } from '../../generate/route';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const job = jobs.get(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Return the full job status
    return NextResponse.json({
      job_id: job.id,
      status: job.status,
      progress: job.progress,
      current_step: job.currentStep,
      created_at: job.createdAt,
      completed_at: job.completedAt,
      failed_at: job.failedAt,
      error: job.error,
      result: job.result,
      options: job.options,
    });

  } catch (error) {
    console.error('Status check error:', error);
    
    return NextResponse.json(
      { error: 'Failed to check job status' },
      { status: 500 }
    );
  }
}