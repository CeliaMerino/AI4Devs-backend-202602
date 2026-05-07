import { Position } from '../../domain/models/Position';

export const getCandidatesByPositionId = async (positionId: number) => {
    const position = await Position.findOne(positionId);

    if (!position) {
        const error = new Error('Position not found');
        (error as any).statusCode = 404;
        throw error;
    }

    const candidatesInPosition = await Position.findCandidatesByPositionId(positionId);

    return candidatesInPosition.map((application: any) => {
        const validScores = application.interviews
            .map((interview: any) => interview.score)
            .filter((score: number | null) => score !== null);

        const averageScore = validScores.length === 0
            ? null
            : validScores.reduce((acc: number, score: number) => acc + score, 0) / validScores.length;

        return {
            candidateId: application.candidate.id,
            fullName: `${application.candidate.firstName} ${application.candidate.lastName}`,
            currentInterviewStep: application.interviewStep,
            averageScore: averageScore,
        };
    });
};
