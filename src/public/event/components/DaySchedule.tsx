import { Box, Typography } from '@mui/material'
import { DateTime } from 'luxon'
import { JsonSession, JsonSpeaker } from '../../../../functions/src/api/routes/deploy/updateWebsiteActions/jsonTypes'
import { Category, Track } from '../../../types'
import { SessionItem } from './SessionItem'
import { useScheduleGrid } from '../hooks/useScheduleGrid'
import { isMobile as isMobileHook, isMobileOrTablet } from '../../../hooks/sizesHooks'

type DayScheduleProps = {
    day: string
    tracks: Track[]
    sessions: JsonSession[]
    speakersData: JsonSpeaker[]
    categories: Category[]
}

export const DaySchedule: React.FC<DayScheduleProps> = ({ tracks, sessions, speakersData, categories }) => {
    const isMobile = isMobileOrTablet()
    const { sessionsWithSpeakers, uniqueTimeSlots, gridTemplateColumns } = useScheduleGrid(
        sessions,
        tracks,
        speakersData
    )

    if (isMobile) {
        return (
            <Box>
                {uniqueTimeSlots.map((time, index) => {
                    const timeFormatted = time.toFormat('HH:mm')
                    const sessionsForThisTime = sessionsWithSpeakers.filter((session) => {
                        if (!session.dateStart) return false
                        const sessionStart = DateTime.fromISO(session.dateStart)
                        return sessionStart.toFormat('HH:mm') === timeFormatted
                    })

                    if (sessionsForThisTime.length === 0) return null

                    return (
                        <Box key={index}>
                            <Typography
                                variant="h6"
                                sx={{
                                    textAlign: 'right',
                                    pr: 2,
                                    pt: 2,
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'center',
                                    fontWeight: 500,
                                    fontSize: '1.6em',
                                    position: 'sticky',
                                    top: 0,
                                    backgroundColor: 'background.paper',
                                    zIndex: 2,
                                    '& .time-minutes': {
                                        fontSize: '0.8em',
                                        opacity: 0.7,
                                        ml: 0.5,
                                        mt: '2px',
                                    },
                                }}>
                                <span>{time.toFormat('HH')}</span>
                                <span className="time-minutes">{time.toFormat('mm')}</span>
                            </Typography>
                            {sessionsForThisTime.map((session) => (
                                <Box
                                    key={session.id}
                                    sx={{
                                        m: 0.5,
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            zIndex: 1,
                                            transform: 'scale(1.02)',
                                        },
                                    }}>
                                    <SessionItem
                                        session={session}
                                        categories={categories}
                                        tracks={tracks}
                                        isMobile={isMobile}
                                    />
                                </Box>
                            ))}
                        </Box>
                    )
                })}
            </Box>
        )
    }

    return (
        <Box>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns,
                    gridAutoRows: 'minmax(100px, auto)',
                    position: 'relative',
                    gap: 1,
                }}>
                {/* Empty cell for top-left corner */}
                <Box sx={{ gridColumn: 1, gridRow: 1 }} />

                <Box
                    sx={{
                        gridColumn: '2 / -1',
                        gridRow: 1,
                        display: 'grid',
                        gridTemplateColumns: `repeat(${tracks.length}, 1fr)`,
                        position: 'sticky',
                        top: 0,
                        backgroundColor: 'background.paper',
                        zIndex: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                    }}>
                    {tracks.map((track, index) => (
                        <Box key={track.id} sx={{ position: 'relative' }}>
                            <Typography
                                sx={{
                                    textAlign: 'center',
                                    fontWeight: 500,
                                    fontSize: '1.4em',
                                    p: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '100%',
                                    height: '100%',
                                }}>
                                {track.name}
                            </Typography>
                            {index < tracks.length - 1 && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        right: 0,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '1px',
                                        height: '70%',
                                        backgroundColor: 'divider',
                                    }}
                                />
                            )}
                        </Box>
                    ))}
                </Box>

                {/* Time slots and sessions for desktop view */}
                {uniqueTimeSlots.map((time, index) => (
                    <Typography
                        key={index}
                        variant="h6"
                        sx={{
                            gridColumn: 1,
                            gridRow: index + 2,
                            textAlign: 'right',
                            pr: 2,
                            pt: 2,
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'flex-end',
                            fontWeight: 500,
                            fontSize: '1.6em',
                            '& .time-minutes': {
                                fontSize: '0.8em',
                                opacity: 0.7,
                                ml: 0.5,
                                mt: '2px',
                            },
                        }}>
                        <span>{time.toFormat('HH')}</span>
                        <span className="time-minutes">{time.toFormat('mm')}</span>
                    </Typography>
                ))}

                {sessionsWithSpeakers.map((session) => {
                    if (!session.dateStart || !session.trackId) return null

                    const sessionStart = DateTime.fromISO(session.dateStart)
                    const rowStart =
                        uniqueTimeSlots.findIndex((time) => time.toFormat('HH:mm') === sessionStart.toFormat('HH:mm')) +
                        2
                    const trackIndex = tracks.findIndex((track) => track.id === session.trackId)
                    const width = session.extendWidth || 1
                    const height = session.extendHeight || 1

                    if (rowStart < 2 || trackIndex === -1) return null

                    return (
                        <Box
                            key={session.id}
                            sx={{
                                gridColumn: `${trackIndex + 2} / span ${width}`,
                                gridRow: `${rowStart} / span ${height}`,
                                m: 0.5,
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                    zIndex: 1,
                                    transform: 'scale(1.02)',
                                },
                            }}>
                            <SessionItem
                                session={session}
                                categories={categories}
                                tracks={tracks}
                                isMobile={isMobile}
                            />
                        </Box>
                    )
                })}
            </Box>
        </Box>
    )
}
