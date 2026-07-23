import { Box, Flex, Stack, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import type { ProjectGlanceItem } from "./dashboard-types";
import {
  DashboardRowDivider,
  DashboardSection,
  DashboardSectionEmpty,
  DashboardSectionHeader,
} from "./DashboardSectionHeader";

interface DashboardProjectsGlanceSectionProps {
  projects: ProjectGlanceItem[];
  canCreate: boolean;
  onCreateProject: () => void;
}

export function DashboardProjectsGlanceSection({
  projects,
  canCreate,
  onCreateProject,
}: DashboardProjectsGlanceSectionProps) {
  const navigate = useNavigate();

  return (
    <DashboardSection>
      <DashboardSectionHeader title="Projects" viewAllHref="/projects" />

      {projects.length === 0 ? (
        <DashboardSectionEmpty
          message="No projects yet"
          actionLabel={canCreate ? "Create project" : undefined}
          onAction={canCreate ? onCreateProject : undefined}
        />
      ) : (
        <Stack gap="0">
          {projects.map((project, index) => (
            <Box key={project.id}>
              {index > 0 && <DashboardRowDivider />}
              <Flex
                gap="3"
                align="flex-start"
                py="3.5"
                cursor="pointer"
                borderRadius="control"
                mx={{ base: "-2", md: "-3" }}
                px={{ base: "2", md: "3" }}
                transition="background 0.15s"
                _hover={{ bg: "bg.surfaceHover" }}
                onClick={() => void navigate(`/projects/${project.id}`)}
              >
                <Flex
                  boxSize="7"
                  align="center"
                  justify="center"
                  borderRadius="control"
                  bg={project.color}
                  color="white"
                  fontSize="2xs"
                  fontWeight="bold"
                  flexShrink="0"
                >
                  {project.key.slice(0, 2)}
                </Flex>
                <Box flex="1" minW="0">
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    color="fg.primary"
                    truncate
                  >
                    {project.name}
                  </Text>
                  <Text fontSize="xs" color="fg.secondary" mt="0.5">
                    {project.openCount} open · {project.inProgressCount} in
                    progress
                    {project.donePercent > 0 &&
                      ` · ${project.donePercent}% done`}
                  </Text>
                </Box>
              </Flex>
            </Box>
          ))}
        </Stack>
      )}
    </DashboardSection>
  );
}
