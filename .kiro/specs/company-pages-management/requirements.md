# Requirements Document

## Introduction

This feature enables administrators to manage the content of company information pages (About Us, Contact, Privacy Policy, Terms of Service) through the admin panel. These are internal pages with fixed URLs - admins edit the page content, not the URLs. Additionally, external links (Community, Help Center) will be added to the existing Social Links admin page for centralized link management.

## Glossary

- **Company_Pages_Page**: The admin panel page for managing company page content
- **Company_Page**: A company information page with a fixed slug and editable content (title, body text)
- **Footer_Component**: The frontend component that displays links to company pages
- **Admin**: An authenticated administrator user with access to the admin panel
- **Rich_Text_Editor**: A WYSIWYG editor for formatting page content

## Requirements

### Requirement 1: View Company Pages List

**User Story:** As an admin, I want to see a list of all company pages, so that I can select which page to edit.

#### Acceptance Criteria

1. WHEN an admin navigates to the Company Pages page, THE Company_Pages_Page SHALL display a list of all four company pages (About Us, Contact, Privacy Policy, Terms of Service)
2. THE Company_Pages_Page SHALL display each page with its title and last updated date
3. THE Company_Pages_Page SHALL provide an Edit button for each page
4. WHEN an admin clicks Edit, THE Company_Pages_Page SHALL navigate to the edit page for that specific company page

### Requirement 2: Edit Company Page Content

**User Story:** As an admin, I want to edit the content of company pages, so that I can update company information displayed to visitors.

#### Acceptance Criteria

1. WHEN an admin navigates to edit a company page, THE Edit_Page SHALL display a form with title and content fields
2. THE Edit_Page SHALL pre-populate the form with the current saved content
3. THE Edit_Page SHALL provide a rich text editor for the content field
4. WHEN an admin clicks Save, THE Edit_Page SHALL validate that title is not empty
5. WHEN an admin submits valid content, THE Edit_Page SHALL save the content and display a success message
6. IF an admin leaves the title empty, THEN THE Edit_Page SHALL display a validation error
7. THE Edit_Page SHALL allow empty content (to show a placeholder on the frontend)

### Requirement 3: Display Company Pages on Frontend

**User Story:** As a site visitor, I want to view company information pages, so that I can learn about the company and its policies.

#### Acceptance Criteria

1. WHEN a visitor navigates to /about, THE About_Page SHALL display the About Us content from the database
2. WHEN a visitor navigates to /contact, THE Contact_Page SHALL display the Contact content from the database
3. WHEN a visitor navigates to /privacy, THE Privacy_Page SHALL display the Privacy Policy content from the database
4. WHEN a visitor navigates to /terms, THE Terms_Page SHALL display the Terms of Service content from the database
5. THE Footer_Component SHALL display links to all four company pages
6. WHEN a company page link is clicked, THE Footer_Component SHALL navigate to the internal page URL

### Requirement 4: Admin Sidebar Navigation

**User Story:** As an admin, I want to access the Company Pages management from the sidebar, so that I can easily navigate to this feature.

#### Acceptance Criteria

1. THE Admin_Sidebar SHALL display a "Company Pages" item under the Settings group with a FileText icon
2. WHEN an admin clicks "Company Pages", THE Admin_Sidebar SHALL navigate to /admin/company-pages
3. WHILE on the Company Pages section, THE Admin_Sidebar SHALL highlight the Company Pages navigation item as active

### Requirement 5: Add External Links to Social Links Page

**User Story:** As an admin, I want to manage Community and Help Center external links alongside social media links, so that all external links are in one place.

#### Acceptance Criteria

1. THE Social_Links_Page SHALL display two additional URL fields for Community and Help Center
2. THE Social_Links_Page SHALL organize fields into two sections: "Social Media" and "External Links"
3. THE Social_Links_Page SHALL validate Community and Help Center URLs the same way as social media URLs
4. WHEN saved, THE Social_Links_Page SHALL persist Community and Help Center URLs to the database
5. THE Footer_Component SHALL display Community and Help Center links in the Resources section when URLs are non-empty
