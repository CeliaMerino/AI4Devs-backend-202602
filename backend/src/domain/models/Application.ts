import { PrismaClient } from '@prisma/client';
import { Interview } from './Interview';

const prisma = new PrismaClient();

export class Application {
    id?: number;
    positionId: number;
    candidateId: number;
    applicationDate: Date;
    currentInterviewStep: number;
    notes?: string;
    interviews: Interview[]; // Added this line

    constructor(data: any) {
        this.id = data.id;
        this.positionId = data.positionId;
        this.candidateId = data.candidateId;
        this.applicationDate = new Date(data.applicationDate);
        this.currentInterviewStep = data.currentInterviewStep;
        this.notes = data.notes;
        this.interviews = data.interviews || []; // Added this line
    }

    async save() {
        const applicationData: any = {
            positionId: this.positionId,
            candidateId: this.candidateId,
            applicationDate: this.applicationDate,
            currentInterviewStep: this.currentInterviewStep,
            notes: this.notes,
        };

        if (this.id) {
            return await prisma.application.update({
                where: { id: this.id },
                data: applicationData,
            });
        } else {
            return await prisma.application.create({
                data: applicationData,
            });
        }
    }

    static async findOne(id: number): Promise<Application | null> {
        const data = await prisma.application.findUnique({
            where: { id: id },
        });
        if (!data) return null;
        return new Application(data);
    }

    static async findOneByCandidate(applicationId: number, candidateId: number) {
        // Paso 1: validar que la application existe y pertenece al candidate
        const app = await prisma.application.findFirst({
            where: {
                id: applicationId,
                candidateId: Number(candidateId),
            },
            select: { id: true, positionId: true, currentInterviewStep: true },
        });
        return app;
    }

    static async updateCurrentInterviewStep(applicationId: number, nextInterviewStepId: number) {
        // Paso 2: actualizar
        const updated = await prisma.application.update({
            where: { id: applicationId },
            data: { currentInterviewStep: nextInterviewStepId },
            select: {
                id: true,
                candidateId: true,
                positionId: true,
                currentInterviewStep: true,
            },
        });

        return updated;
    }
}
