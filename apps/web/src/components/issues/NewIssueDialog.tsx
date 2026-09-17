import {
  Box,
  Button,
  Dialog,
  Field,
  Flex,
  HStack,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useState } from "react";
import toast from "react-hot-toast";
import { PiArrowLeft, PiFolderOpen } from "react-icons/pi";
import { Link as RouterLink } from "react-router-dom";

import { isSessionExpiredError } from "../../auth-api";
import type { ProjectSummary } from "../projects/project-types";
import type { Issue } from "./issue-types";
import type { IssuePriority, IssueStatus } from "./IssueFilterBar";
import { CreateIssueError } from "./issues-api";
import { EASE_OUT, transition } from "./issues-motion";
import { IssueStatusSelect } from "./IssueStatusSelect";
import { useCreateIssueMutation } from "./use-issues-queries";

const TITLE_MAX_LENGTH = 200;

interface NewIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  projects: ProjectSummary[];
  projectsLoading?: boolean;
  projectsError?: boolean;
  /** When set, skip the project picker and lock to this project. */
  lockedProjectId?: string;
  initialProjectId?: string;
  initialStatus?: IssueStatus;
  onCreated: (issue: Issue) => void;
}

export function NewIssueDialog({
  open,
  onOpenChange,
  orgId,
  projects,
  projectsLoading = false,
  projectsError = false,
  lockedProjectId,
  initialProjectId,
  initialStatus,
  onCreated,
}: NewIssueDialogProps) {
  const createMutation = useCreateIssueMutation(orgId);
  const lockedProject =
    projects.find((project) => project.id === lockedProjectId) ?? null;

  const [step, setStep] = useState<"project" | "form">(
    lockedProject ? "form" : "project"
  );
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(
    lockedProject
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<IssuePriority>("medium");
  const [status, setStatus] = useState<IssueStatus>("todo");
  const [titleError, setTitleError] = useState("");

  const [prevOpen, setPrevOpen] = useState(open);

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      const presetId = lockedProjectId ?? initialProjectId;
      if (presetId) {
        const project = projects.find((item) => item.id === presetId) ?? null;
        setSelectedProject(project);
        setStep(project ? "form" : "project");
      } else {
        setSelectedProject(lockedProject);
        setStep(lockedProject ? "form" : "project");
      }
      setStatus(initialStatus ?? "todo");
    }
  }

  const reset = () => {
    setStep(lockedProject ? "form" : "project");
    setSelectedProject(lockedProject);
    setTitle("");
    setDescription("");
    setPriority("medium");
    setStatus("todo");
    setTitleError("");
  };

  const handleCreate = () => {
    if (!selectedProject) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError("Please enter a title");
      return;
    }
    if (trimmedTitle.length > TITLE_MAX_LENGTH) {
      setTitleError(`Title must be ${TITLE_MAX_LENGTH} characters or fewer`);
      return;
    }

    createMutation.mutate(
      {
        input: {
          title: trimmedTitle,
          description: description.trim(),
          priority,
          status,
          projectId: selectedProject.id,
        },
        extras: { projectColor: selectedProject.color },
      },
      {
        onSuccess: (issue) => {
          onCreated(issue);
          reset();
          onOpenChange(false);
          toast.success("Issue created");
        },
        onError: (error) => {
          if (isSessionExpiredError(error)) return;
          if (error instanceof CreateIssueError && error.fields?.title?.[0]) {
            setTitleError(error.fields.title[0].message);
            return;
          }
          toast.error(
            error instanceof CreateIssueError
              ? error.message
              : "Couldn't create this issue"
          );
        },
      }
    );
  };

  const showProjectPicker = !lockedProjectId;
  const pending = createMutation.isPending;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) reset();
        onOpenChange(e.open);
      }}
      placement="center"
    >
      <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <Dialog.Positioner>
        <Dialog.Content
          bg="bg.surface"
          borderRadius="card"
          maxW="md"
          w="full"
          mx="4"
          boxShadow="elevated"
          animation={`rivet-scale-in 0.28s ${EASE_OUT} both`}
        >
          <Dialog.Header pt="6" px="6" pb="0">
            <Dialog.Title color="fg.primary">
              {showProjectPicker && step === "project"
                ? "New issue — choose project"
                : "New issue"}
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Body px="6" py="5">
            {showProjectPicker && step === "project" ? (
              <ProjectPickerStep
                projects={projects}
                selectedProject={selectedProject}
                onSelect={setSelectedProject}
                loading={projectsLoading}
                error={projectsError}
              />
            ) : (
              <Stack gap="4">
                <HStack
                  gap="2"
                  px="3"
                  py="2"
                  borderRadius="control"
                  bg="bg.surfaceHover"
                  borderWidth="1px"
                  borderColor="border.default"
                >
                  <Box
                    boxSize="2.5"
                    borderRadius="sm"
                    bg={selectedProject?.color}
                  />
                  <Text fontSize="sm" color="fg.secondary">
                    {selectedProject?.name}{" "}
                    <Text as="span" fontFamily="mono" color="fg.muted">
                      ({selectedProject?.key})
                    </Text>
                  </Text>
                </HStack>

                <Field.Root invalid={!!titleError}>
                  <Field.Label color="fg.primary">Title</Field.Label>
                  <Input
                    placeholder="What needs to be done?"
                    borderRadius="control"
                    value={title}
                    maxLength={TITLE_MAX_LENGTH}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (titleError && e.target.value.trim())
                        setTitleError("");
                    }}
                    autoFocus
                  />
                  <Field.ErrorText>{titleError}</Field.ErrorText>
                </Field.Root>

                <Field.Root>
                  <Field.Label color="fg.primary">
                    Description{" "}
                    <Text as="span" color="fg.muted" fontWeight="normal">
                      (optional)
                    </Text>
                  </Field.Label>
                  <Textarea
                    placeholder="Add more context…"
                    borderRadius="control"
                    rows={3}
                    resize="none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Field.Root>

                <HStack gap="4" align="flex-start">
                  <Field.Root flex="1">
                    <Field.Label color="fg.primary">Priority</Field.Label>
                    <NativeSelect.Root size="sm">
                      <NativeSelect.Field
                        borderRadius="control"
                        value={priority}
                        onChange={(e) =>
                          setPriority(e.target.value as IssuePriority)
                        }
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </NativeSelect.Field>
                    </NativeSelect.Root>
                  </Field.Root>

                  <Field.Root flex="1">
                    <Field.Label color="fg.primary">Status</Field.Label>
                    <IssueStatusSelect value={status} onChange={setStatus} />
                  </Field.Root>
                </HStack>
              </Stack>
            )}
          </Dialog.Body>
          <Dialog.Footer px="6" pb="6" pt="0" gap="3">
            {showProjectPicker && step === "form" && (
              <Button
                variant="ghost"
                borderRadius="control"
                disabled={pending}
                onClick={() => setStep("project")}
              >
                <PiArrowLeft size={16} />
                Back
              </Button>
            )}
            <Box flex="1" />
            <Button
              variant="outline"
              borderRadius="control"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            {showProjectPicker && step === "project" ? (
              projects.length > 0 && !projectsLoading && !projectsError ? (
                <Button
                  borderRadius="control"
                  bg="accent.default"
                  color="white"
                  _hover={{ bg: "accent.hover" }}
                  disabled={!selectedProject}
                  onClick={() => setStep("form")}
                >
                  Continue
                </Button>
              ) : null
            ) : (
              <Button
                borderRadius="control"
                bg="accent.default"
                color="white"
                _hover={{ bg: "accent.hover" }}
                onClick={handleCreate}
                loading={pending}
                disabled={!selectedProject}
              >
                Create issue
              </Button>
            )}
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

function ProjectPickerStep({
  projects,
  selectedProject,
  onSelect,
  loading,
  error,
}: {
  projects: ProjectSummary[];
  selectedProject: ProjectSummary | null;
  onSelect: (project: ProjectSummary) => void;
  loading: boolean;
  error: boolean;
}) {
  if (loading) {
    return (
      <Text fontSize="sm" color="fg.secondary">
        Loading projects…
      </Text>
    );
  }

  if (error) {
    return (
      <Text fontSize="sm" color="fg.secondary">
        Couldn&apos;t load projects. Close this dialog and try again.
      </Text>
    );
  }

  if (projects.length === 0) {
    return (
      <Stack gap="4" align="flex-start">
        <Flex
          boxSize="10"
          align="center"
          justify="center"
          borderRadius="control"
          bg="brand.subtle"
          color="accent.default"
        >
          <PiFolderOpen size={20} />
        </Flex>
        <Box>
          <Text fontSize="sm" fontWeight="semibold" color="fg.primary" mb="1">
            No projects yet
          </Text>
          <Text fontSize="sm" color="fg.secondary">
            Create a project first, then you can add issues to it.
          </Text>
        </Box>
        <Button asChild borderRadius="control" size="sm" variant="outline">
          <RouterLink to="/projects">Go to projects</RouterLink>
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="2">
      <Text fontSize="sm" color="fg.secondary" mb="2">
        Which project does this issue belong to?
      </Text>
      {projects.map((project, index) => (
        <HStack
          key={project.id}
          gap="3"
          px="3"
          py="3"
          borderRadius="control"
          borderWidth="1px"
          borderColor={
            selectedProject?.id === project.id
              ? "accent.default"
              : "border.default"
          }
          bg={
            selectedProject?.id === project.id ? "brand.subtle" : "transparent"
          }
          cursor="pointer"
          transition={transition.base}
          animation={`rivet-fade-in-up 0.35s ${EASE_OUT} both`}
          style={{ animationDelay: `${index * 40}ms` }}
          _hover={{
            borderColor: "accent.default",
            transform: "translateY(-1px)",
            boxShadow: "subtle",
          }}
          onClick={() => onSelect(project)}
        >
          <Flex
            boxSize="9"
            align="center"
            justify="center"
            borderRadius="control"
            bg={project.color}
            color="white"
            fontWeight="bold"
            fontSize="xs"
            flexShrink="0"
          >
            {project.key.slice(0, 2)}
          </Flex>
          <Box minW="0">
            <Text fontSize="sm" fontWeight="semibold" color="fg.primary">
              {project.name}
            </Text>
            <Text fontSize="xs" color="fg.muted" fontFamily="mono">
              {project.key}
            </Text>
          </Box>
        </HStack>
      ))}
    </Stack>
  );
}
