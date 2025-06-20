import {
    Box,
    Button,
    Card,
    Container,
    FormControlLabel,
    Grid,
    IconButton,
    InputAdornment,
    Menu,
    MenuItem,
    Select,
    Switch,
    TextField,
    Typography,
    Checkbox,
    Chip,
    OutlinedInput,
    FormControl,
    InputLabel,
} from '@mui/material'
import * as React from 'react'
import { useMemo, useState } from 'react'
import { Event, Session } from '../../../../types'
import { useSessions } from '../../../../services/hooks/useSessions'
import { FirestoreQueryLoaderAndErrorDisplay } from '../../../../components/FirestoreQueryLoaderAndErrorDisplay'
import { EventSessionItem } from '../EventSessionItem'
import { Clear, ExpandMore } from '@mui/icons-material'
import { filterSessions } from './filterSessions'
import { FilterCategory } from './FilterCategory'
import { FilterFormat } from './FilterFormat'
import { GenerateSessionsTextContentDialog } from '../components/GenerateSessionsTextContentDialog'
import { useSearchParams } from 'wouter'
import { GenerateSessionsVideoDialog } from '../components/GenerateSessionsVideoDialog'
import { exportSessionsAction, SessionsExportType } from './actions/exportSessionsActions'
import { TeasingPostSocials } from '../../../actions/sessions/generation/generateSessionTeasingContent'
import { MoveImagesAlert } from '../components/MoveImagesAlert'
import { useSessionsBatchEdit } from './hooks/useSessionsBatchEdit'
import { BatchEditDialog } from './components/BatchEditDialog'

export type EventSessionsProps = {
    event: Event
}
export const EventSessions = ({ event }: EventSessionsProps) => {
    const [searchParams, setSearchParams] = useSearchParams()
    const sessions = useSessions(event)
    const [search, setSearch] = useState<string>('')
    const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '')
    const [selectedFormat, setSelectedFormat] = useState<string>(searchParams.get('format') || '')
    const [onlyWithoutSpeaker, setOnlyWithoutSpeaker] = useState<boolean>(false)
    const [generateAnchorEl, setGenerateAnchorEl] = React.useState<null | HTMLElement>(null)
    const isGenerateMenuOpen = Boolean(generateAnchorEl)
    const [exportAnchorEl, setExportAnchorEl] = React.useState<null | HTMLElement>(null)
    const isExportMenuOpen = Boolean(exportAnchorEl)
    const [generateTextDialogOpen, setGenerateTextDialogOpen] = useState(false)
    const [generateVideoDialogOpen, setGenerateVideoDialogOpen] = useState(false)
    const [selectedNotAnnouncedOn, setSelectedNotAnnouncedOn] = useState<TeasingPostSocials[]>([])

    const handleNotAnnouncedOnChange = (event: any) => {
        const value = event.target.value
        setSelectedNotAnnouncedOn(typeof value === 'string' ? value.split(',') : value)
    }

    const sessionsData = useMemo(() => sessions.data || [], [sessions.data])

    const displayedSessions = useMemo(() => {
        return filterSessions(sessionsData, {
            search,
            category: selectedCategory,
            format: selectedFormat,
            withoutSpeaker: onlyWithoutSpeaker,
            notAnnouncedOn: selectedNotAnnouncedOn,
        })
    }, [sessionsData, search, selectedCategory, selectedFormat, onlyWithoutSpeaker, selectedNotAnnouncedOn])

    // Use the batch edit hook
    const {
        selectedSessions,
        handleSessionSelect,
        handleSelectAll,
        batchEditDialogOpen,
        openBatchEditDialog,
        closeBatchEditDialog,
        handleUpdateSessions,
    } = useSessionsBatchEdit({
        event,
        displayedSessions,
        reloadSessions: sessions.load,
    })

    const isFiltered = displayedSessions.length !== sessionsData.length

    const closeGenerateMenu = (type: string) => () => {
        setGenerateAnchorEl(null)
        switch (type) {
            case 'text':
                setGenerateTextDialogOpen(true)
                break
            case 'video':
                setGenerateVideoDialogOpen(true)
                break
            default:
                console.warn('Unknown type', type)
                break
        }
    }

    const closeExportMenu = (type: SessionsExportType | null) => () => {
        setExportAnchorEl(null)
        if (!type) return

        exportSessionsAction(sessionsData, displayedSessions, type, event.timezone || undefined)
    }

    if (sessions.isLoading) {
        return <FirestoreQueryLoaderAndErrorDisplay hookResult={sessions} />
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <MoveImagesAlert event={event} sessionsData={sessionsData} />

            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" marginBottom={1}>
                <Typography>
                    {isFiltered
                        ? `${displayedSessions.length}/${sessionsData.length} sessions`
                        : `${sessionsData.length} sessions`}
                </Typography>
                <Button onClick={(event: React.MouseEvent<HTMLButtonElement>) => setGenerateAnchorEl(event.currentTarget)} endIcon={<ExpandMore />}>
                    Generate
                </Button>
                <Menu
                    id="basic-menu"
                    anchorEl={generateAnchorEl}
                    open={isGenerateMenuOpen}
                    onClose={closeGenerateMenu('')}
                    MenuListProps={{
                        'aria-labelledby': 'basic-button',
                    }}>
                    <MenuItem onClick={closeGenerateMenu('text')}>Teasing for socials</MenuItem>
                    <MenuItem onClick={closeGenerateMenu('video')}>Teasing video using ShortVid.io</MenuItem>
                </Menu>
                <Button onClick={(event: React.MouseEvent<HTMLButtonElement>) => setExportAnchorEl(event.currentTarget)} endIcon={<ExpandMore />}>
                    Export
                </Button>
                <Menu anchorEl={exportAnchorEl} open={isExportMenuOpen} onClose={closeExportMenu(null)}>
                    {Object.entries(SessionsExportType).map(([key, value]) => (
                        <MenuItem key={key} onClick={closeExportMenu(value)}>
                            {value}
                        </MenuItem>
                    ))}
                </Menu>
                <Button onClick={openBatchEditDialog} disabled={selectedSessions.length === 0} sx={{ mr: 1 }}>
                    Batch Edit ({selectedSessions.length})
                </Button>
                <Button href="/sessions/new" variant="contained">
                    Add session
                </Button>
            </Box>
            <Card sx={{ paddingX: 2 }}>
                <Grid container spacing={1}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            placeholder="Search"
                            fullWidth
                            size="small"
                            margin="normal"
                            value={search}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                            InputProps={{
                                endAdornment: isFiltered ? (
                                    <InputAdornment position="start">
                                        <IconButton
                                            aria-label="Clear filters"
                                            onClick={() => {
                                                setSearch('')
                                                setSearchParams({})
                                                setSelectedCategory('')
                                                setSelectedFormat('')
                                            }}
                                            edge="end">
                                            <Clear />
                                        </IconButton>
                                    </InputAdornment>
                                ) : null,
                            }}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <FilterCategory
                            event={event}
                            sessions={sessionsData}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={(category) => {
                                setSelectedCategory(category)
                                setSearchParams({ category, format: selectedFormat })
                            }}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <FilterFormat
                            event={event}
                            sessions={sessionsData}
                            selectedFormat={selectedFormat}
                            setSelectedFormat={(format) => {
                                setSelectedFormat(format)
                                setSearchParams({ format, category: selectedCategory })
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    value={onlyWithoutSpeaker}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOnlyWithoutSpeaker(e.target.checked)}
                                />
                            }
                            label="Without speaker"
                        />
                        <FormControl sx={{ ml: 2, minWidth: 200 }} size="small">
                            <InputLabel id="not-announced-label">Not announced on</InputLabel>
                            <Select
                                labelId="not-announced-label"
                                multiple
                                value={selectedNotAnnouncedOn}
                                onChange={handleNotAnnouncedOnChange}
                                input={<OutlinedInput label="Not announced on" />}
                                renderValue={(selected: TeasingPostSocials[]) => (
                                    <>
                                        {selected.map((value: TeasingPostSocials) => (
                                            <Chip key={value} label={value} />
                                        ))}
                                    </>
                                )}
                                displayEmpty
                                MenuProps={{
                                    PaperProps: {
                                        style: {
                                            maxHeight: 224,
                                        },
                                    },
                                }}>
                                <MenuItem disabled value="">
                                    <em>Select platforms</em>
                                </MenuItem>
                                {Object.values(TeasingPostSocials).map((social) => (
                                    <MenuItem key={social} value={social}>
                                        {social}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
                <FormControlLabel
                    sx={{ marginLeft: 0 }}
                    control={
                        <Checkbox
                            checked={selectedSessions.length === displayedSessions.length}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSelectAll(e.target.checked)}
                        />
                    }
                    label={<Typography variant="body2">Select All</Typography>}
                />
                {displayedSessions.map((session: Session) => (
                    <Box key={session.id} display="flex" alignItems="flex-start">
                        <Checkbox
                            checked={selectedSessions.includes(session.id)}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSessionSelect(session.id, e.target.checked)}
                        />
                        <Box flexGrow={1}>
                            <EventSessionItem session={session} selectFormat={setSelectedFormat} />
                        </Box>
                    </Box>
                ))}
            </Card>
            {generateTextDialogOpen && (
                <GenerateSessionsTextContentDialog
                    isOpen={generateTextDialogOpen}
                    onClose={() => {
                        setGenerateTextDialogOpen(false)
                    }}
                    event={event}
                    sessions={displayedSessions}
                />
            )}
            {generateVideoDialogOpen && (
                <GenerateSessionsVideoDialog
                    isOpen={generateVideoDialogOpen}
                    onClose={() => {
                        setGenerateVideoDialogOpen(false)
                    }}
                    event={event}
                    sessions={displayedSessions}
                />
            )}

            {/* Batch Edit Dialog */}
            <BatchEditDialog
                isOpen={batchEditDialogOpen}
                onClose={closeBatchEditDialog}
                selectedSessions={selectedSessions}
                displayedSessions={displayedSessions}
                event={event}
                onUpdateSessions={handleUpdateSessions}
            />
        </Container>
    )
}

// @ts-ignore: Ignore missing MUI type declarations
