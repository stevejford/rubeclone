'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { workspaceCreateSchema, WorkspaceCreateInput } from '@/lib/validations/workspace';
import { useWorkspace } from '@/lib/hooks/use-workspace';

interface CreateWorkspaceFormProps {
  onSuccess?: () => void;
}

export function CreateWorkspaceForm({ onSuccess }: CreateWorkspaceFormProps) {
  const router = useRouter();
  const { refreshWorkspaces, switchWorkspace } = useWorkspace();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<WorkspaceCreateInput>({
    resolver: zodResolver(workspaceCreateSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'personal',
    },
  });

  const onSubmit = async (data: WorkspaceCreateInput) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create workspace');
      }

      const result = await response.json();

      // Refresh workspaces list
      await refreshWorkspaces();

      // Switch to the new workspace context
      await switchWorkspace(result.workspace.id.toString());

      // Close dialog if callback provided, otherwise redirect
      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to the new workspace
        router.push(`/workspaces/${result.workspace.id}`);
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
      // You might want to show a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Awesome Workspace" {...field} />
                  </FormControl>
                  <FormDescription>
                    Choose a name that describes your workspace or project.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this workspace is for..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Help your team understand the purpose of this workspace.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Workspace Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div className="flex items-center space-x-2 border rounded-lg p-4">
                        <RadioGroupItem value="personal" id="personal" />
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <div>
                            <label htmlFor="personal" className="text-sm font-medium cursor-pointer">
                              Personal
                            </label>
                            <p className="text-xs text-muted-foreground">
                              For individual projects
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-lg p-4">
                        <RadioGroupItem value="company" id="company" />
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4" />
                          <div>
                            <label htmlFor="company" className="text-sm font-medium cursor-pointer">
                              Company
                            </label>
                            <p className="text-xs text-muted-foreground">
                              For team collaboration
                            </p>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

        <div className="flex justify-end space-x-4">
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Workspace
          </Button>
        </div>
      </form>
    </Form>
  );
}
