import { Request, Response } from 'express';
import { addCandidate, findCandidateById, updateCandidateStage } from '../../application/services/candidateService';

export const addCandidateController = async (req: Request, res: Response) => {
    try {
        const candidateData = req.body;
        const candidate = await addCandidate(candidateData);
        res.status(201).json({ message: 'Candidate added successfully', data: candidate });
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ message: 'Error adding candidate', error: error.message });
        } else {
            res.status(400).json({ message: 'Error adding candidate', error: 'Unknown error' });
        }
    }
};

export const getCandidateById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }
        const candidate = await findCandidateById(id);
        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }
        res.json(candidate);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updateCandidateStageController = async (req: Request, res: Response) => {
    try {
        const candidateId = parseInt(req.params.id);
        const { applicationId, currentInterviewStep } = req.body;

        if (
            isNaN(candidateId) ||
            typeof applicationId !== 'number' ||
            Number.isNaN(applicationId) ||
            typeof currentInterviewStep !== 'number' ||
            Number.isNaN(currentInterviewStep)
        ) {
            return res.status(400).json({ error: 'Invalid request data' });
        }

        const updatedApplication = await updateCandidateStage(candidateId, applicationId, currentInterviewStep);
        return res.status(200).json(updatedApplication);
    } catch (error: any) {
        if (error?.statusCode === 404) {
            return res.status(404).json({ error: error.message });
        }

        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export { addCandidate };