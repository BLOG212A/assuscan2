CREATE TABLE `chatMessages` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`contractId` varchar(64),
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`fileName` text NOT NULL,
	`fileUrl` text,
	`contractType` varchar(64),
	`status` enum('actif','resilie','a_renouveler') DEFAULT 'actif',
	`extractedText` text,
	`mainCoverages` json,
	`amounts` json,
	`exclusions` json,
	`optimizationScore` int,
	`potentialSavings` int,
	`coverageGaps` json,
	`recommendations` json,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` varchar(64) NOT NULL,
	`email` varchar(320),
	`fullName` text,
	`avatarUrl` text,
	`subscriptionPlan` enum('free','premium') NOT NULL DEFAULT 'free',
	`documentsUploaded` int NOT NULL DEFAULT 0,
	`documentsLimit` int NOT NULL DEFAULT 3,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `chatMessages` ADD CONSTRAINT `chatMessages_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chatMessages` ADD CONSTRAINT `chatMessages_contractId_contracts_id_fk` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_id_users_id_fk` FOREIGN KEY (`id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
