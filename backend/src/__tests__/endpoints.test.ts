import express from 'express';
import request from 'supertest';

const mockPrisma = {
    position: {
        findUnique: jest.fn(),
    },
    application: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
    },
    candidate: {
        findUnique: jest.fn(),
    },
};

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrisma),
    Prisma: {
        PrismaClientInitializationError: class PrismaClientInitializationError extends Error { },
    },
}));

const candidateRoutes = require('../routes/candidateRoutes').default;
const positionRoutes = require('../routes/positionRoutes').default;

const app = express();
app.use(express.json());
app.use('/positions', positionRoutes);
app.use('/candidates', candidateRoutes);

describe('GET /positions/:id/candidates', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns candidates in position (happy path)', async () => {
        mockPrisma.position.findUnique.mockResolvedValue({
            id: 1,
            companyId: 1,
            interviewFlowId: 1,
            title: 'Backend Developer',
            description: 'Backend role',
            status: 'Open',
            isVisible: true,
            location: 'Remote',
            jobDescription: 'API development',
        });

        mockPrisma.application.findMany.mockResolvedValue([
            {
                id: 100,
                candidate: {
                    id: 10,
                    firstName: 'Ana',
                    lastName: 'Lopez',
                    email: 'ana@example.com',
                    phone: '600123123',
                },
                interviewStep: {
                    id: 2,
                    name: 'Technical Interview',
                    orderIndex: 2,
                },
                interviews: [
                    { id: 1, score: 4 },
                    { id: 2, score: null },
                    { id: 3, score: 5 },
                ],
            },
        ]);

        const response = await request(app).get('/positions/1/candidates');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            {
                candidateId: 10,
                fullName: 'Ana Lopez',
                currentInterviewStep: {
                    id: 2,
                    name: 'Technical Interview',
                    orderIndex: 2,
                },
                averageScore: 4.5,
            },
        ]);
    });

    it('returns 404 when position does not exist', async () => {
        mockPrisma.position.findUnique.mockResolvedValue(null);

        const response = await request(app).get('/positions/999/candidates');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Position not found' });
    });

    it('returns averageScore as null when candidate has no interviews', async () => {
        mockPrisma.position.findUnique.mockResolvedValue({
            id: 1,
            companyId: 1,
            interviewFlowId: 1,
            title: 'Backend Developer',
            description: 'Backend role',
            status: 'Open',
            isVisible: true,
            location: 'Remote',
            jobDescription: 'API development',
        });

        mockPrisma.application.findMany.mockResolvedValue([
            {
                id: 101,
                candidate: {
                    id: 11,
                    firstName: 'Mario',
                    lastName: 'NoInterview',
                    email: 'mario@example.com',
                    phone: '600000001',
                },
                interviewStep: {
                    id: 1,
                    name: 'HR Screening',
                    orderIndex: 1,
                },
                interviews: [],
            },
        ]);

        const response = await request(app).get('/positions/1/candidates');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            {
                candidateId: 11,
                fullName: 'Mario NoInterview',
                currentInterviewStep: {
                    id: 1,
                    name: 'HR Screening',
                    orderIndex: 1,
                },
                averageScore: null,
            },
        ]);
    });

    it('returns averageScore as null when all interview scores are null', async () => {
        mockPrisma.position.findUnique.mockResolvedValue({
            id: 1,
            companyId: 1,
            interviewFlowId: 1,
            title: 'Backend Developer',
            description: 'Backend role',
            status: 'Open',
            isVisible: true,
            location: 'Remote',
            jobDescription: 'API development',
        });

        mockPrisma.application.findMany.mockResolvedValue([
            {
                id: 102,
                candidate: {
                    id: 12,
                    firstName: 'Laura',
                    lastName: 'NullScore',
                    email: 'laura@example.com',
                    phone: '600000002',
                },
                interviewStep: {
                    id: 2,
                    name: 'Technical Interview',
                    orderIndex: 2,
                },
                interviews: [
                    { id: 21, score: null },
                    { id: 22, score: null },
                ],
            },
        ]);

        const response = await request(app).get('/positions/1/candidates');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            {
                candidateId: 12,
                fullName: 'Laura NullScore',
                currentInterviewStep: {
                    id: 2,
                    name: 'Technical Interview',
                    orderIndex: 2,
                },
                averageScore: null,
            },
        ]);
    });

    it('returns 400 when position id is invalid', async () => {
        const response = await request(app).get('/positions/invalid/candidates');

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid ID format' });
    });
});

describe('PUT /candidates/:id/stage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('updates candidate stage (happy path)', async () => {
        mockPrisma.candidate.findUnique.mockResolvedValue({
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
        });

        mockPrisma.application.findFirst.mockResolvedValue({
            id: 5,
            positionId: 1,
            currentInterviewStep: 1,
        });

        mockPrisma.application.update.mockResolvedValue({
            id: 5,
            candidateId: 1,
            positionId: 1,
            currentInterviewStep: 2,
        });

        const response = await request(app)
            .put('/candidates/1/stage')
            .send({ applicationId: 5, currentInterviewStep: 2 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            id: 5,
            candidateId: 1,
            positionId: 1,
            currentInterviewStep: 2,
        });
    });

    it('returns 404 when candidate does not exist', async () => {
        mockPrisma.candidate.findUnique.mockResolvedValue(null);

        const response = await request(app)
            .put('/candidates/999/stage')
            .send({ applicationId: 5, currentInterviewStep: 2 });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Candidate not found' });
    });

    it('returns 404 when application does not belong to candidate', async () => {
        mockPrisma.candidate.findUnique.mockResolvedValue({
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
        });
        mockPrisma.application.findFirst.mockResolvedValue(null);

        const response = await request(app)
            .put('/candidates/1/stage')
            .send({ applicationId: 999, currentInterviewStep: 2 });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Application not found for candidate' });
    });

    it('returns 400 when body data is invalid', async () => {
        const response = await request(app)
            .put('/candidates/1/stage')
            .send({ applicationId: 'abc', currentInterviewStep: 'x' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid request data' });
    });

    it('returns 500 when update fails unexpectedly', async () => {
        mockPrisma.candidate.findUnique.mockResolvedValue({
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
        });
        mockPrisma.application.findFirst.mockResolvedValue({
            id: 5,
            positionId: 1,
            currentInterviewStep: 1,
        });
        mockPrisma.application.update.mockRejectedValue(new Error('Unexpected DB error'));

        const response = await request(app)
            .put('/candidates/1/stage')
            .send({ applicationId: 5, currentInterviewStep: 2 });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Internal Server Error' });
    });
});
