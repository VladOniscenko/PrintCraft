using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrintCraftApi.Migrations
{
    /// <inheritdoc />
    public partial class AddFaqAndCities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"PreferredLanguage\" text NOT NULL DEFAULT 'en';");
            migrationBuilder.Sql("ALTER TABLE \"Orders\" ADD COLUMN IF NOT EXISTS \"Language\" text NOT NULL DEFAULT 'en';");
            migrationBuilder.Sql("ALTER TABLE \"EmailTemplates\" ADD COLUMN IF NOT EXISTS \"Language\" text NOT NULL DEFAULT 'en';");
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_EmailTemplates_TemplateName_Language\" ON \"EmailTemplates\" (\"TemplateName\", \"Language\");");

            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS ""OrderItemChangeRequests"" (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""OrderItemId"" uuid NOT NULL,
                    ""OrderId"" uuid NOT NULL,
                    ""Status"" text NOT NULL DEFAULT 'pending_customer',
                    ""ReasonCategory"" text NOT NULL DEFAULT 'broken_geometry',
                    ""AdminNotes"" text NOT NULL DEFAULT '',
                    ""RequiresNewFile"" boolean NOT NULL DEFAULT TRUE,
                    ""RequestedBy"" text NULL,
                    ""RequestedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""PreviousFileUrl"" text NULL,
                    ""PreviousFileName"" text NULL,
                    ""SubmittedFileUrl"" text NULL,
                    ""SubmittedFileName"" text NULL,
                    ""CustomerNotes"" text NULL,
                    ""SubmittedAt"" timestamp with time zone NULL,
                    ""ResolvedBy"" text NULL,
                    ""ResolutionNotes"" text NULL,
                    ""ResolvedAt"" timestamp with time zone NULL,
                    CONSTRAINT ""FK_OrderItemChangeRequests_OrderItems_OrderItemId"" FOREIGN KEY (""OrderItemId"") REFERENCES ""OrderItems""(""Id"") ON DELETE CASCADE,
                    CONSTRAINT ""FK_OrderItemChangeRequests_Orders_OrderId"" FOREIGN KEY (""OrderId"") REFERENCES ""Orders""(""Id"") ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS ""IX_OrderItemChangeRequests_OrderItemId_Status"" ON ""OrderItemChangeRequests""(""OrderItemId"", ""Status"");
                CREATE INDEX IF NOT EXISTS ""IX_OrderItemChangeRequests_OrderId_RequestedAt"" ON ""OrderItemChangeRequests""(""OrderId"", ""RequestedAt"");

                CREATE TABLE IF NOT EXISTS ""Cities"" (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""Slug"" text NOT NULL,
                    ""Names"" text NOT NULL,
                    ""Province"" text NOT NULL,
                    ""Latitude"" double precision NULL,
                    ""Longitude"" double precision NULL,
                    ""IsActive"" boolean NOT NULL DEFAULT TRUE,
                    ""SortOrder"" integer NOT NULL DEFAULT 0,
                    ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT NOW()
                );
                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Cities_Slug"" ON ""Cities"" (""Slug"");
                CREATE INDEX IF NOT EXISTS ""IX_Cities_Province_IsActive"" ON ""Cities"" (""Province"", ""IsActive"");

                CREATE TABLE IF NOT EXISTS ""FaqItems"" (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""Question"" text NOT NULL,
                    ""Answer"" text NOT NULL,
                    ""Category"" text NOT NULL,
                    ""SortOrder"" integer NOT NULL DEFAULT 0,
                    ""IsActive"" boolean NOT NULL DEFAULT TRUE,
                    ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS ""IX_FaqItems_Category_IsActive_SortOrder"" ON ""FaqItems"" (""Category"", ""IsActive"", ""SortOrder"");

                CREATE TABLE IF NOT EXISTS ""FaqTopics"" (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""Slug"" text NOT NULL,
                    ""Key"" text NULL,
                    ""Names"" text NOT NULL,
                    ""Tagline"" text NOT NULL,
                    ""Badge"" text NOT NULL,
                    ""HeroTitle"" text NOT NULL,
                    ""HeroSubtitle"" text NOT NULL,
                    ""Description"" text NOT NULL,
                    ""Benefits"" text NOT NULL,
                    ""RecommendedMaterials"" text NOT NULL,
                    ""LeadTime"" text NOT NULL,
                    ""Precision"" text NOT NULL,
                    ""MetaTitle"" text NOT NULL,
                    ""MetaDescription"" text NOT NULL,
                    ""MetaKeywords"" text NOT NULL,
                    ""Faqs"" text NOT NULL,
                    ""IsActive"" boolean NOT NULL DEFAULT TRUE,
                    ""SortOrder"" integer NOT NULL DEFAULT 0,
                    ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT NOW()
                );
                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_FaqTopics_Slug"" ON ""FaqTopics"" (""Slug"");
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DROP TABLE IF EXISTS ""Cities"";
                DROP TABLE IF EXISTS ""FaqItems"";
                DROP TABLE IF EXISTS ""FaqTopics"";
            ");
        }
    }
}
