-- Update tool_count in subcategories based on actual tool count
UPDATE free_ai_tools_subcategories s
SET tool_count = (
  SELECT COUNT(*) 
  FROM free_ai_tools_tools t 
  WHERE t.subcategory_id = s.id
);

-- Update tool_count in categories based on sum of subcategory tool counts
UPDATE free_ai_tools_categories c
SET tool_count = (
  SELECT COALESCE(SUM(s.tool_count), 0)
  FROM free_ai_tools_subcategories s
  WHERE s.category_id = c.id
);;
