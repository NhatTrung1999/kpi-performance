BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[managers] (
    [personSerialKey] VARCHAR(20) NOT NULL,
    [personId] VARCHAR(20) NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [managers_isActive_df] DEFAULT 1,
    [grantedAt] DATETIME2 NOT NULL CONSTRAINT [managers_grantedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [managers_pkey] PRIMARY KEY CLUSTERED ([personSerialKey])
);

-- CreateTable
CREATE TABLE [dbo].[manager_scopes] (
    [personSerialKey] VARCHAR(20) NOT NULL,
    [unitType] VARCHAR(12) NOT NULL,
    [unitKey] VARCHAR(20) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [manager_scopes_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [manager_scopes_pkey] PRIMARY KEY CLUSTERED ([personSerialKey],[unitType],[unitKey])
);

-- CreateTable
CREATE TABLE [dbo].[permission_changes] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [personSerialKey] VARCHAR(20) NOT NULL,
    [personId] VARCHAR(20),
    [personName] NVARCHAR(100),
    [action] VARCHAR(10) NOT NULL,
    [oldScopes] NVARCHAR(max),
    [newScopes] NVARCHAR(max),
    [changedBy] VARCHAR(20) NOT NULL,
    [changedAt] DATETIME2 NOT NULL CONSTRAINT [permission_changes_changedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [permission_changes_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [manager_scopes_unitKey_idx] ON [dbo].[manager_scopes]([unitKey]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [permission_changes_personSerialKey_changedAt_idx] ON [dbo].[permission_changes]([personSerialKey], [changedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [permission_changes_changedAt_idx] ON [dbo].[permission_changes]([changedAt]);

-- AddForeignKey
ALTER TABLE [dbo].[manager_scopes] ADD CONSTRAINT [manager_scopes_personSerialKey_fkey] FOREIGN KEY ([personSerialKey]) REFERENCES [dbo].[managers]([personSerialKey]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraint (viết tay: Prisma không sinh CHECK cho SQL Server)
ALTER TABLE [dbo].[manager_scopes] ADD CONSTRAINT [manager_scopes_unitType_ck] CHECK ([unitType] IN ('TEAM', 'NO_TEAM', 'DEPARTMENT'));

-- AddCheckConstraint
ALTER TABLE [dbo].[permission_changes] ADD CONSTRAINT [permission_changes_action_ck] CHECK ([action] IN ('GRANT', 'REVOKE', 'SCOPE'));

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
