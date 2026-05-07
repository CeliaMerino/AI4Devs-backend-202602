import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const company = await prisma.company.upsert({
        where: { name: 'LTI Seed Company' },
        update: {},
        create: { name: 'LTI Seed Company' },
    });

    const interviewFlow = await prisma.interviewFlow.create({
        data: {
            description: 'Seed flow for GET /positions/:id/candidates',
        },
    });

    const hrInterviewType = await prisma.interviewType.create({
        data: {
            name: 'HR Interview (Seed)',
            description: 'Seed interview type',
        },
    });

    const techInterviewType = await prisma.interviewType.create({
        data: {
            name: 'Technical Interview (Seed)',
            description: 'Seed interview type',
        },
    });

    const hrStep = await prisma.interviewStep.create({
        data: {
            interviewFlowId: interviewFlow.id,
            interviewTypeId: hrInterviewType.id,
            name: 'HR Screening',
            orderIndex: 1,
        },
    });

    const techStep = await prisma.interviewStep.create({
        data: {
            interviewFlowId: interviewFlow.id,
            interviewTypeId: techInterviewType.id,
            name: 'Technical Round',
            orderIndex: 2,
        },
    });

    const position = await prisma.position.create({
        data: {
            companyId: company.id,
            interviewFlowId: interviewFlow.id,
            title: 'Backend Engineer Seed Position',
            description: 'Position created by seed for endpoint testing',
            status: 'Open',
            isVisible: true,
            location: 'Madrid',
            jobDescription: 'Build backend APIs',
        },
    });

    const employee = await prisma.employee.upsert({
        where: { email: 'seed.interviewer@lti.com' },
        update: {},
        create: {
            companyId: company.id,
            name: 'Seed Interviewer',
            email: 'seed.interviewer@lti.com',
            role: 'Interviewer',
        },
    });

    const candidateWithScores = await prisma.candidate.upsert({
        where: { email: 'seed.candidate.scored@example.com' },
        update: {},
        create: {
            firstName: 'Laura',
            lastName: 'Scored',
            email: 'seed.candidate.scored@example.com',
            phone: '612345678',
            address: 'Seed Street 1',
        },
    });

    const candidateWithoutScores = await prisma.candidate.upsert({
        where: { email: 'seed.candidate.noscore@example.com' },
        update: {},
        create: {
            firstName: 'Mario',
            lastName: 'NoScore',
            email: 'seed.candidate.noscore@example.com',
            phone: '612345679',
            address: 'Seed Street 2',
        },
    });

    const applicationWithScores = await prisma.application.create({
        data: {
            positionId: position.id,
            candidateId: candidateWithScores.id,
            applicationDate: new Date(),
            currentInterviewStep: techStep.id,
            notes: 'Has interviews with valid scores',
        },
    });

    const applicationWithoutScores = await prisma.application.create({
        data: {
            positionId: position.id,
            candidateId: candidateWithoutScores.id,
            applicationDate: new Date(),
            currentInterviewStep: hrStep.id,
            notes: 'Has interviews with null score',
        },
    });

    await prisma.interview.createMany({
        data: [
            {
                applicationId: applicationWithScores.id,
                interviewStepId: hrStep.id,
                employeeId: employee.id,
                interviewDate: new Date(),
                result: 'Passed',
                score: 4,
                notes: 'Good communication',
            },
            {
                applicationId: applicationWithScores.id,
                interviewStepId: techStep.id,
                employeeId: employee.id,
                interviewDate: new Date(),
                result: 'Passed',
                score: 5,
                notes: 'Strong backend knowledge',
            },
            {
                applicationId: applicationWithoutScores.id,
                interviewStepId: hrStep.id,
                employeeId: employee.id,
                interviewDate: new Date(),
                result: 'Pending',
                score: null,
                notes: 'Awaiting final evaluation',
            },
        ],
    });

    console.log('Seed created successfully.');
    console.log(`Use this position id for testing: ${position.id}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
