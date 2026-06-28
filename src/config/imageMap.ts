export const LOCAL_Note = "This file is a bridge to switch between local assets and remote URLs.";

// Keys MUST match the exercise IDs used in the database/app
export const EXERCISE_IMAGES: Record<string, any> = {
    // Core Exercises
    'bicep-curls': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767027803/bicep-curls_upoegx.jpg",
    'push-ups': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767027970/push-ups_u37jsf.jpg",
    'squats': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767027988/squats_yqbz5e.jpg",
    'plank': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767027907/plank_nrvrje.jpg",
    'lunges': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767027972/lunges_azuxub.png",
    'glute-bridges': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767027868/glute-bridges_uig1yt.png",
    'side-plank': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767027987/side-plank_ueuzas.png",
    'wall-sit': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767028010/wall-sit_pnzyus.png",
    'tricep-dips': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767028038/tricep-dips_lwrclh.png",
    'bird-dog': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767027855/bird-dog_dte0rm.png",
    'calf-raises': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767027899/calf-raises_wbrpw5.png",
    'superman': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767027997/superman_xqjp2z.png",
    'bicycle-crunches': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767027881/bicycle-crunches_zsmmpo.png",
    'reverse-lunges': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767028007/reverse-lunges_loobzn.png",
    'pike-pushups': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767027978/pike-pushups_ogckei.png",

    // Advanced / Machine / Other
    'db_shoulder_press': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767027972/db-shoulder-press_lm8mkh.png",
    'db_hammer_curl': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767027803/bicep-curls_upoegx.jpg", // Placeholder using bicep curls
    'db_tricep_extension': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767028038/tricep-dips_lwrclh.png", // Placeholder using tricep dips
    'rb_row': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767028012/rb-row_niabra.png",
    'rb_chest_press': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767028014/rb-chest-press_pihifc.png",
    'pb_pullup_standard': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767027998/pullups_mv1rxw.png",
    'kb_swing': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767027990/kb-swing_ruffoy.png",
    'kb_snatch': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767027886/kb-snatch._pfa9qz.png",
    'bb_squat': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767027967/bb-squat_fysaba.png",
    'bb_bench_press': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767027895/bb-bench-press_usbibb.png",
    'cable_lat_pulldown': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767027856/cable-lat-pulldown_csw5g8.png",
    'cable_tricep_pushdown': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767028785/cable-tricep-pushdown_aqgecv.jpg",
    'machine_leg_press': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767028788/leg-press_beqeem.jpg",
    'smith_squat': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767028786/smith-squat_rsevv4.jpg",
    'bench_bulgarian_split_squat': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767028784/bulgarian-split-squat_txpmia.jpg",

    // Cardio & HIIT
    'jumping-jacks': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767884269/jumping-jacks_yjynlh.png",
    'burpees': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767884278/burpees_wyckiw.png",
    'mountain-climbers': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767884266/mountain-climbers_d9teyy.png",
    'high-knees': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767884263/high-knees_gmktb9.png",
    'jump-rope': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767884258/jump-rope_esu78w.png",
    'running-in-place': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767884257/running-in-place_mbtwpp.png",

    // Flexibility & Stretching
    'forward-fold': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767884288/forward-fold_eaoo6x.png",
    'cat-cow': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767884259/cat-cow_wgl848.jpg",
    'childs-pose': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767884247/childs-pose_cortxu.png",
    'downward-dog': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767884277/downward-dog_f5nml6.png",
    'quad-stretch': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767884261/quad-stretch_mvebz9.jpg",
    'shoulder-stretch': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767884247/shoulder-stretch_gqyppr.png",

    // Plyometric
    'jump-squats': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767884259/jump-squats_qhcg1t.jpg",
    'box-jumps': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767884252/box-jumps_ym9d0p.jpg",
    'plyo-pushups': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767884252/plyo-pushups_stmqzv.jpg",
    'tuck-jumps': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767884250/tuck-jumps_mwh9vo.jpg",
    'lateral-bounds': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767884236/lateral-bounds_iskalu.jpg",

    // Recovery
    'gentle-yoga-flow': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767884252/yoga-flow_qo2zzc.jpg",
    'foam-rolling': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767884248/foam-rolling_zyu7ij.jpg",
    'deep-breathing': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767884245/deep-breathing_dxif0r.jpg",
    'light-stretching-circuit': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767884241/stretching-circuit_ne67z0.jpg",
    'easy-cycling': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767884241/easy-cycling_ejta7k.jpg",

    // Logos and Misc
    'app-logo': "https://res.cloudinary.com/ddtslpjdf/image/upload/v1767885071/ChatGPT_Image_Jan_1_2026_02_00_59_PM_gqwae7.png",

};

// Helper function to get image source (safe for both require and URI)
export const getExerciseImage = (key: string) => {
    const image = EXERCISE_IMAGES[key];

    // If it's a string (remote URL), return uri object
    if (typeof image === 'string') {
        return { uri: image, cache: 'force-cache' };
    }

    // If it's a number (local require) or object, return it directly
    return image;
};
