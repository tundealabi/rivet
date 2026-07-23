import type { InputProps } from "@chakra-ui/react";
import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  HStack,
  Input,
  InputGroup,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { PiNutFill } from "react-icons/pi";
import { Link as RouterLink, Navigate, useNavigate } from "react-router-dom";

import registerImage from "../assets/register/register.png";
import {
  ApiRequestError,
  isAuthenticated,
  loginUser,
  saveAuthSession,
} from "../auth-api";

function LogoMark(props: { size?: number }) {
  return <PiNutFill size={props.size ?? 32} />;
}

function BrandLogo({ color = "fg.primary" }: { color?: string }) {
  return (
    <RouterLink to="/" style={{ textDecoration: "none" }}>
      <HStack gap="2.5">
        <Box
          color={color === "white" ? "white" : "accent.default"}
          lineHeight="0"
        >
          <LogoMark size={30} />
        </Box>
        <Text
          fontSize="xl"
          fontWeight="bold"
          color={color}
          letterSpacing="-0.02em"
        >
          Rivet
        </Text>
      </HStack>
    </RouterLink>
  );
}

interface FloatingInputProps extends InputProps {
  label: string;
  error?: string;
  endElement?: ReactNode;
}

function FloatingInput({
  label,
  error,
  endElement,
  ...inputProps
}: FloatingInputProps) {
  return (
    <Field.Root invalid={!!error}>
      <Box position="relative" w="full">
        <Text
          position="absolute"
          top="2"
          left="4"
          fontSize="10px"
          fontWeight="semibold"
          letterSpacing="0.02em"
          color="fg.muted"
          zIndex="1"
          pointerEvents="none"
        >
          {label}
        </Text>
        <InputGroup endElement={endElement}>
          <Input
            h="14"
            pt="4"
            ps="4"
            fontSize="sm"
            fontWeight="medium"
            color="fg.primary"
            bg="bg.surfaceHover"
            borderColor="border.default"
            borderRadius="control"
            _hover={{ borderColor: "fg.muted" }}
            _focus={{
              borderColor: "accent.default",
              bg: "bg.surface",
              boxShadow: "none",
            }}
            {...inputProps}
          />
        </InputGroup>
      </Box>
      <Field.ErrorText>{error}</Field.ErrorText>
    </Field.Root>
  );
}

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginForm />;
}

function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: ({ authTokens, user }) => {
      saveAuthSession(authTokens, user);
      toast.success(`Welcome back, ${user.firstName}`);
      void navigate("/dashboard");
    },
    onError: (error) => {
      if (error instanceof ApiRequestError && error.fields) {
        setErrors({
          email: error.fields.email?.[0]?.message,
          password: error.fields.password?.[0]?.message,
        });
      }

      toast.error(error instanceof Error ? error.message : "Unable to log in");
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: FormErrors = {};

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      next.email = "Please enter a valid email address";
    }
    if (!password) {
      next.password = "Please enter your password";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    loginMutation.mutate({
      email: email.trim(),
      password,
    });
  };

  return (
    <Flex minH="100svh" bg="bg.canvas">
      <Flex
        display={{ base: "none", lg: "flex" }}
        flex="1"
        direction="column"
        p="12"
        color="white"
        position="relative"
        overflow="hidden"
        backgroundImage={`linear-gradient(135deg, rgba(30, 27, 75, 0.82), rgba(79, 70, 229, 0.45)), url(${registerImage})`}
        backgroundPosition="center"
        backgroundSize="cover"
      >
        <Box zIndex="1">
          <BrandLogo color="white" />
        </Box>

        <Flex flex="1" direction="column" justify="center" zIndex="1">
          <Stack gap="5" maxW="lg">
            <Text
              fontSize="sm"
              fontWeight="bold"
              letterSpacing="0.14em"
              textTransform="uppercase"
            >
              Welcome back
            </Text>
            <Heading
              fontSize={{ lg: "4xl", xl: "5xl" }}
              lineHeight="1.2"
              letterSpacing="-0.02em"
              fontWeight="semibold"
            >
              Pick up where you left off and{" "}
              <Box as="span" color="#A5B4FC">
                keep work moving
              </Box>
            </Heading>
            <Text fontSize="xs" color="whiteAlpha.800" maxW="2xs">
              Sign in to plan, track, and ship your best work with your team.
            </Text>
          </Stack>
        </Flex>
      </Flex>

      <Flex
        flex="1"
        align="center"
        justify="center"
        p={{ base: "6", md: "12" }}
      >
        <Box w="full" maxW="md">
          <Box
            mb="10"
            display={{ base: "flex", lg: "none" }}
            justifyContent="center"
          >
            <BrandLogo />
          </Box>

          <Heading
            size="3xl"
            color="fg.primary"
            letterSpacing="-0.02em"
            lineHeight="1.15"
            mb="3"
          >
            Welcome
            <Box as="span" display="block">
              back
              <Box as="span" color="accent.default">
                .
              </Box>
            </Box>
          </Heading>
          <Text color="fg.secondary" fontSize="sm" mb="8">
            Enter your details to access your workspace.
          </Text>

          <form onSubmit={handleSubmit} noValidate>
            <Stack gap="4">
              <FloatingInput
                label="Email"
                error={errors.email}
                type="email"
                placeholder="Enter your email address"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                endElement={<MdEmail size={19} />}
              />

              <FloatingInput
                label="Password"
                error={errors.password}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                endElement={
                  <Button
                    variant="ghost"
                    size="xs"
                    color="fg.muted"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    type="button"
                  >
                    {showPassword ? (
                      <FaEyeSlash size={18} />
                    ) : (
                      <FaEye size={18} />
                    )}
                  </Button>
                }
              />

              <Text fontSize="sm" color="fg.secondary" textAlign="right">
                New to Rivet?{" "}
                <Link
                  href="/register"
                  color="accent.default"
                  fontWeight="medium"
                >
                  Create an account
                </Link>
              </Text>

              <Button
                type="submit"
                size="lg"
                borderRadius="full"
                bg="accent.default"
                color="white"
                fontWeight="semibold"
                _hover={{ bg: "accent.hover" }}
                loading={loginMutation.isPending}
                loadingText="Signing in..."
              >
                Log In
              </Button>
            </Stack>
          </form>
        </Box>
      </Flex>
    </Flex>
  );
}
