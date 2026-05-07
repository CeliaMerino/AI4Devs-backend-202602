import { Request, Response } from 'express';
import { getCandidatesByPositionId } from '../../application/services/positionService';

export const getCandidatesByPosition = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const candidates = await getCandidatesByPositionId(id);
        return res.status(200).json(candidates);
    } catch (error: any) {
        if (error?.statusCode === 404) {
            return res.status(404).json({ error: 'Position not found' });
        }

        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
