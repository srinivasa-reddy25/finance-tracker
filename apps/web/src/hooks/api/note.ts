import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { TApiResponse, TNote } from '@tejadev/shared'
import { api } from '@/lib/api'

type TNoteWithId = TNote & { _id: string }

// --- api calls ---

const getAllNotes = (): Promise<TApiResponse<TNoteWithId[]>> => {
  return api.get('/note')
}

const getNoteById = (note_id: string): Promise<TApiResponse<TNoteWithId>> => {
  return api.get(`/note/${note_id}`)
}

const createNote = (body: {
  note: string
}): Promise<TApiResponse<{ note_id: string }>> => {
  return api.post('/note', body)
}

const updateNoteById = (
  note_id: string,
  body: { note: string }
): Promise<TApiResponse<void>> => {
  return api.patch(`/note/${note_id}`, body)
}

const deleteNoteById = (note_id: string): Promise<TApiResponse<void>> => {
  return api.delete(`/note/${note_id}`)
}

// --- hooks ---

export const useGetAllNotes = () => {
  return useQuery({
    queryKey: ['notes'],
    queryFn: getAllNotes
  })
}

export const useGetNoteById = (note_id: string) => {
  return useQuery({
    queryKey: ['notes', note_id],
    queryFn: () => getNoteById(note_id),
    enabled: !!note_id
  })
}

export const useCreateNote = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { note: string }) => createNote(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    }
  })
}

export const useUpdateNoteById = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ note_id, note }: { note_id: string; note: string }) =>
      updateNoteById(note_id, { note }),
    onSuccess: (_data, { note_id }) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['notes', note_id] })
    }
  })
}

export const useDeleteNoteById = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (note_id: string) => deleteNoteById(note_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    }
  })
}
