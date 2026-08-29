import {
  Box,
  Button,
  Dialog,
  Field,
  Flex,
  HStack,
  IconButton,
  Input,
  Popover,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  PiCaretRight,
  PiDotsThreeBold,
  PiPlusBold,
  PiSignOut,
} from "react-icons/pi";
import { Link as RouterLink } from "react-router-dom";

import { isSessionExpiredError } from "../../auth-api";
import { EASE_OUT, transition } from "../issues/issues-motion";
import type { ProjectStats } from "./project-stats";
import type { Project } from "./project-types";
import type { UpdateProjectInput } from "./projects-api";
import { ProjectStatStrip } from "./ProjectStatStrip";

function StatusPill({ status }: { status: Project["status"] }) {
  const active = status === "active";

  return (
    <HStack
      gap="1.5"
      px="2.5"
      py="1"
      borderRadius="badge"
      borderWidth="1px"
      borderColor="border.default"
      bg="bg.surfaceHover"
      flexShrink="0"
    >
      <Box
        boxSize="1.5"
        borderRadius="full"
        bg={active ? "status.success" : "fg.muted"}
      />
      <Text fontSize="xs" fontWeight="medium" color="fg.secondary">
        {active ? "Active" : "Archived"}
      </Text>
    </HStack>
  );
}

interface InlineNameEditorProps {
  value: string;
  editable: boolean;
  onSave: (name: string) => void;
  editSignal?: number;
}

function InlineNameEditor({
  value,
  editable,
  onSave,
  editSignal = 0,
}: InlineNameEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const ignoreBlurRef = useRef(false);

  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setDraft(value);
  }

  const [prevEditSignal, setPrevEditSignal] = useState({
    editSignal,
    editable,
  });
  if (
    prevEditSignal.editSignal !== editSignal ||
    prevEditSignal.editable !== editable
  ) {
    setPrevEditSignal({ editSignal, editable });
    if (editSignal > 0 && editable) {
      setEditing(true);
    }
  }

  useEffect(() => {
    if (!editing) return;

    ignoreBlurRef.current = true;
    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    const armTimer = window.setTimeout(() => {
      ignoreBlurRef.current = false;
    }, 300);

    return () => {
      window.clearTimeout(focusTimer);
      window.clearTimeout(armTimer);
    };
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setDraft(value);
      setEditing(false);
      return;
    }
    if (trimmed !== value) onSave(trimmed);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (ignoreBlurRef.current) {
            inputRef.current?.focus();
            return;
          }
          commit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        fontSize={{ base: "2xl", md: "3xl" }}
        fontWeight="700"
        color="fg.primary"
        letterSpacing="-0.03em"
        borderRadius="control"
        px="2"
        h="auto"
        py="1"
        maxW={{ base: "full", md: "xl" }}
      />
    );
  }

  return (
    <Box
      as={editable ? "button" : "h1"}
      fontSize={{ base: "2xl", md: "3xl" }}
      fontWeight="700"
      color="fg.primary"
      letterSpacing="-0.03em"
      lineHeight="1.2"
      textAlign="left"
      cursor={editable ? "text" : "default"}
      borderRadius="control"
      px={editable ? "2" : "0"}
      py={editable ? "1" : "0"}
      mx={editable ? "-2" : "0"}
      transition={transition.base}
      _hover={editable ? { bg: "bg.surfaceHover" } : undefined}
      onClick={editable ? () => setEditing(true) : undefined}
    >
      {value}
    </Box>
  );
}

interface DescriptionEditorProps {
  value: string;
  editable: boolean;
  onSave: (description: string) => void;
}

function DescriptionEditor({
  value,
  editable,
  onSave,
}: DescriptionEditorProps) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setDraft(value);
  }

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(draft.length, draft.length);
    }
  }, [editing, draft.length]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed !== value) onSave(trimmed);
    setEditing(false);
    setExpanded(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
    setExpanded(false);
  };

  const isLong = value.length > 90;
  const showPlaceholder = !value.trim() && editable;

  if (editing) {
    return (
      <Textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            commit();
          }
        }}
        fontSize="sm"
        color="fg.secondary"
        borderRadius="control"
        rows={expanded || draft.length > 90 ? 4 : 2}
        resize="vertical"
        maxW="3xl"
        placeholder="Add a description..."
      />
    );
  }

  if (showPlaceholder) {
    return (
      <Box
        as="button"
        fontSize="sm"
        color="fg.muted"
        fontStyle="italic"
        textAlign="left"
        cursor="pointer"
        bg="transparent"
        border="none"
        p="0"
        _hover={{ color: "fg.secondary" }}
        onClick={() => {
          setExpanded(true);
          setEditing(true);
        }}
      >
        Add a description...
      </Box>
    );
  }

  if (!value.trim()) {
    return null;
  }

  return (
    <Box
      as={editable ? "button" : "p"}
      fontSize="sm"
      color="fg.secondary"
      lineHeight="1.6"
      textAlign="left"
      maxW="3xl"
      lineClamp={expanded ? undefined : 1}
      cursor={
        editable ? "pointer" : isLong && !expanded ? "pointer" : "default"
      }
      borderRadius="control"
      px={editable ? "2" : "0"}
      py={editable ? "1" : "0"}
      mx={editable ? "-2" : "0"}
      bg="transparent"
      border="none"
      transition={transition.base}
      _hover={editable ? { bg: "bg.surfaceHover" } : undefined}
      onClick={
        editable
          ? () => {
              if (isLong && !expanded) {
                setExpanded(true);
              } else {
                setEditing(true);
                setExpanded(true);
              }
            }
          : isLong && !expanded
            ? () => setExpanded(true)
            : undefined
      }
    >
      {value}
    </Box>
  );
}

interface ChangeKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentKey: string;
  onSave: (key: string) => void;
}

function ChangeKeyDialog({
  open,
  onOpenChange,
  currentKey,
  onSave,
}: ChangeKeyDialogProps) {
  const [key, setKey] = useState(currentKey);
  const [error, setError] = useState("");

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setKey(currentKey);
      setError("");
    }
  }

  const handleSave = () => {
    const trimmed = key.trim().toUpperCase();
    if (!trimmed) {
      setError("Please enter a project key");
      return;
    }
    onSave(trimmed);
    onOpenChange(false);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      placement="center"
    >
      <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <Dialog.Positioner>
        <Dialog.Content
          bg="bg.surface"
          borderRadius="card"
          maxW="sm"
          w="full"
          mx="4"
          animation={`rivet-scale-in 0.28s ${EASE_OUT} both`}
        >
          <Dialog.Header pt="6" px="6" pb="0">
            <Dialog.Title color="fg.primary">Change project key</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body px="6" py="5">
            <Field.Root invalid={!!error}>
              <Field.Label color="fg.primary">Key</Field.Label>
              <Input
                value={key}
                onChange={(e) => {
                  setKey(e.target.value.toUpperCase().slice(0, 5));
                  if (error) setError("");
                }}
                fontFamily="mono"
                maxW="32"
                borderRadius="control"
                autoFocus
              />
              <Field.HelperText color="fg.muted">
                Used as a prefix for issue IDs, e.g. {key || "KEY"}-42
              </Field.HelperText>
              <Field.ErrorText>{error}</Field.ErrorText>
            </Field.Root>
          </Dialog.Body>
          <Dialog.Footer px="6" pb="6" pt="0" gap="3">
            <Button
              variant="outline"
              borderRadius="control"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              borderRadius="control"
              bg="accent.default"
              color="white"
              _hover={{ bg: "accent.hover" }}
              onClick={handleSave}
            >
              Save key
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onConfirm: () => void | Promise<void>;
}

function DeleteProjectDialog({
  open,
  onOpenChange,
  projectName,
  onConfirm,
}: DeleteProjectDialogProps) {
  const [confirmName, setConfirmName] = useState("");
  const [pending, setPending] = useState(false);

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open) {
      setConfirmName("");
      setPending(false);
    }
  }

  const matches = confirmName.trim() === projectName;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
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
          animation={`rivet-scale-in 0.28s ${EASE_OUT} both`}
        >
          <Dialog.Header pt="6" px="6" pb="0">
            <Dialog.Title color="fg.primary">Delete project</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body px="6" py="5">
            <Stack gap="4">
              <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
                This permanently deletes{" "}
                <Text as="span" fontWeight="semibold" color="fg.primary">
                  {projectName}
                </Text>{" "}
                and all of its issues. This action cannot be undone.
              </Text>
              <Field.Root>
                <Field.Label color="fg.primary">
                  Type{" "}
                  <Text as="span" fontFamily="mono">
                    {projectName}
                  </Text>{" "}
                  to confirm
                </Field.Label>
                <Input
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  borderRadius="control"
                  autoFocus
                />
              </Field.Root>
            </Stack>
          </Dialog.Body>
          <Dialog.Footer px="6" pb="6" pt="0" gap="3">
            <Button
              variant="outline"
              borderRadius="control"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              borderRadius="control"
              bg="status.error"
              color="white"
              _hover={{ bg: "red.600" }}
              disabled={!matches || pending}
              loading={pending}
              onClick={() => {
                void (async () => {
                  setPending(true);
                  try {
                    await onConfirm();
                    onOpenChange(false);
                  } catch {
                    setPending(false);
                  }
                })();
              }}
            >
              Delete project
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

interface ProjectOverflowMenuProps {
  project: Project;
  onRename: () => void;
  onChangeKey: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
  archivePending?: boolean;
  deletePending?: boolean;
}

function ProjectOverflowMenu({
  project,
  onRename,
  onChangeKey,
  onArchive,
  onRestore,
  onDelete,
  archivePending = false,
  deletePending = false,
}: ProjectOverflowMenuProps) {
  const [open, setOpen] = useState(false);

  const closeAnd = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      positioning={{ placement: "bottom-end" }}
    >
      <Popover.Trigger asChild>
        <IconButton
          aria-label="Project actions"
          variant="outline"
          size="sm"
          borderRadius="control"
          borderColor="border.default"
          color="fg.secondary"
          _hover={{ bg: "bg.surfaceHover", color: "fg.primary" }}
        >
          <PiDotsThreeBold size={18} />
        </IconButton>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content
          bg="bg.surface"
          borderRadius="control"
          borderWidth="1px"
          borderColor="border.default"
          boxShadow="elevated"
          p="1"
          minW="44"
          animation={`rivet-scale-in 0.2s ${EASE_OUT} both`}
        >
          <Stack gap="0.5">
            <Button
              variant="ghost"
              size="sm"
              justifyContent="flex-start"
              borderRadius="control"
              fontWeight="medium"
              color="fg.primary"
              onClick={() => closeAnd(onRename)}
            >
              Rename project
            </Button>
            <Button
              variant="ghost"
              size="sm"
              justifyContent="flex-start"
              borderRadius="control"
              fontWeight="medium"
              color="fg.primary"
              onClick={() => closeAnd(onChangeKey)}
            >
              Change key
            </Button>
            {project.status === "active" ? (
              <Button
                variant="ghost"
                size="sm"
                justifyContent="flex-start"
                borderRadius="control"
                fontWeight="medium"
                color="fg.primary"
                disabled={archivePending}
                onClick={() => closeAnd(onArchive)}
              >
                Archive project
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                justifyContent="flex-start"
                borderRadius="control"
                fontWeight="medium"
                color="fg.primary"
                disabled={archivePending}
                onClick={() => closeAnd(onRestore)}
              >
                Unarchive project
              </Button>
            )}
            <Box h="1px" bg="border.divider" my="0.5" />
            <Button
              variant="ghost"
              size="sm"
              justifyContent="flex-start"
              borderRadius="control"
              fontWeight="medium"
              color="status.error"
              _hover={{ bg: "danger.ghostHover", color: "status.error" }}
              onClick={() => closeAnd(onDelete)}
              disabled={deletePending}
            >
              Delete project
            </Button>
          </Stack>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
}

interface ProjectDetailHeaderProps {
  project: Project;
  stats: ProjectStats;
  statsLoading?: boolean;
  canEdit: boolean;
  canCreateIssue: boolean;
  canManage: boolean;
  onLogout: () => void;
  onProjectChange: (patch: Partial<Project>) => void;
  onUpdateProject: (input: UpdateProjectInput) => Promise<void>;
  onNewIssue: () => void;
  onDeleteProject: () => void | Promise<void>;
  onArchive: () => void;
  onRestore: () => void;
  archivePending?: boolean;
  deletePending?: boolean;
}

export function ProjectDetailHeader({
  project,
  stats,
  statsLoading = false,
  canEdit,
  canCreateIssue,
  canManage,
  onLogout,
  onProjectChange,
  onUpdateProject,
  onNewIssue,
  onDeleteProject,
  onArchive,
  onRestore,
  archivePending = false,
  deletePending = false,
}: ProjectDetailHeaderProps) {
  const [renameSignal, setRenameSignal] = useState(0);
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <>
      <Flex
        as="header"
        direction="column"
        px={{ base: "5", md: "10" }}
        py="5"
        borderBottomWidth="1px"
        borderColor="border.default"
        bg="bg.surface"
        gap="4"
        flexShrink="0"
        animation={`rivet-fade-in 0.4s ${EASE_OUT} both`}
      >
        <HStack gap="1.5" fontSize="sm" color="fg.muted">
          <RouterLink
            to="/projects"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Text
              _hover={{ color: "fg.secondary" }}
              transition={transition.base}
            >
              Projects
            </Text>
          </RouterLink>
          <PiCaretRight size={12} />
          <Text color="accent.default" fontWeight="medium" truncate>
            {project.name}
          </Text>
        </HStack>

        <Flex
          align={{ base: "flex-start", lg: "flex-start" }}
          justify="space-between"
          direction={{ base: "column", lg: "row" }}
          gap="5"
        >
          <Box flex="1" minW="0">
            <Flex align="center" gap="3" flexWrap="wrap" mb="2">
              <InlineNameEditor
                value={project.name}
                editable={canEdit}
                editSignal={renameSignal}
                onSave={(name) => {
                  void onUpdateProject({ name })
                    .then(() => toast.success("Project renamed"))
                    .catch((error) => {
                      if (isSessionExpiredError(error)) return;
                    });
                }}
              />
              <HStack gap="2" flexShrink="0">
                <StatusPill status={project.status} />
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  color="fg.muted"
                  fontFamily="mono"
                >
                  {project.key}
                </Text>
              </HStack>
            </Flex>

            <DescriptionEditor
              value={project.description}
              editable={canEdit}
              onSave={(description) => {
                void onUpdateProject({ description })
                  .then(() => toast.success("Description updated"))
                  .catch((error) => {
                    if (isSessionExpiredError(error)) return;
                  });
              }}
            />
          </Box>

          <HStack
            gap="3"
            flexShrink="0"
            alignSelf={{ base: "stretch", lg: "flex-start" }}
          >
            <Button
              variant="outline"
              size="sm"
              borderRadius="control"
              borderColor="status.error"
              color="status.error"
              fontWeight="medium"
              display={{ base: "inline-flex", md: "none" }}
              _hover={{
                bg: "danger.ghostHover",
                color: "status.error",
                borderColor: "status.error",
              }}
              onClick={onLogout}
            >
              <PiSignOut size={16} />
              Log out
            </Button>

            {canCreateIssue && (
              <Button
                borderRadius="full"
                bg="accent.default"
                color="white"
                fontWeight="semibold"
                transition={transition.base}
                boxShadow="0 2px 8px rgba(79, 70, 229, 0.28)"
                _hover={{
                  bg: "accent.hover",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
                }}
                _active={{ transform: "translateY(0)" }}
                onClick={onNewIssue}
              >
                <PiPlusBold /> New issue
              </Button>
            )}

            {canManage && (
              <ProjectOverflowMenu
                project={project}
                onRename={() => {
                  window.setTimeout(() => {
                    setRenameSignal((n) => n + 1);
                  }, 200);
                }}
                onChangeKey={() => setKeyDialogOpen(true)}
                onArchive={onArchive}
                onRestore={onRestore}
                onDelete={() => setDeleteDialogOpen(true)}
                archivePending={archivePending}
                deletePending={deletePending}
              />
            )}
          </HStack>
        </Flex>

        <ProjectStatStrip stats={stats} loading={statsLoading} />
      </Flex>

      <ChangeKeyDialog
        open={keyDialogOpen}
        onOpenChange={setKeyDialogOpen}
        currentKey={project.key}
        onSave={(key) => {
          onProjectChange({ key });
          toast.success("Project key updated");
        }}
      />

      <DeleteProjectDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        projectName={project.name}
        onConfirm={onDeleteProject}
      />
    </>
  );
}
