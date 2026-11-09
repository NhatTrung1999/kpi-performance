BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo') EXEC sp_executesql N'CREATE SCHEMA [dbo];';

-- CreateTable
CREATE TABLE [dbo].[auth_sessions] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [userId] VARCHAR(10) NOT NULL,
    [accountId] VARCHAR(15) NOT NULL,
    [tokenHash] VARBINARY(32) NOT NULL,
    [remember] BIT NOT NULL CONSTRAINT [auth_sessions_remember_df] DEFAULT 0,
    [userAgent] NVARCHAR(255),
    [ip] VARCHAR(45),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [auth_sessions_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [lastUsedAt] DATETIME2 NOT NULL CONSTRAINT [auth_sessions_lastUsedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [expiresAt] DATETIME2 NOT NULL,
    [revokedAt] DATETIME2,
    [revokeReason] NVARCHAR(50),
    CONSTRAINT [auth_sessions_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [auth_sessions_userId_idx] ON [dbo].[auth_sessions]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [auth_sessions_expiresAt_idx] ON [dbo].[auth_sessions]([expiresAt]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
