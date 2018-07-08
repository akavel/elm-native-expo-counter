module Main exposing (..)

import Task
import Color exposing (Color)
import Json.Decode as Json
import Expo exposing (..)
import Expo.LowLevel as LowLevel
import Expo.Attribute as Attr


-- MODEL


type alias Model =
    { n : Int
    }


model : Model
model =
    { n = 9000
    }


-- UPDATE


type Msg
    = Increment
    | Decrement
    | TouchDown Expo.Position


update : Msg -> Model -> ( Model, Cmd Msg )
-- update : Msg -> Model -> Model
update msg model =
    case msg of
        Increment ->
            ( { model | n = model.n + 1 }, Cmd.none )

        Decrement ->
            ( { model | n = model.n - 1 }, Cmd.none )

        TouchDown _ ->
            ( { model | n = Debug.log "CLICKS:" (model.n + 1) }, Cmd.none )


-- VIEW


view : Model -> Node Msg
view model =
    Expo.view
        [ Attr.double "flex" 1
        , Attr.string "alignItems" "center"
        , Attr.string "justifyContent" "center"
        ]
        [ node "RCTScrollView" []
            [ Expo.view
                [ Attr.bool "collapsable" False ]
                [ Expo.view []
                    ( List.range 1 100
                    |> List.map (\n -> text ("Entry " ++ toString n))
                    )
                ]
            ]
        ]
        -- [ text "hello Elm-Expo!"
        -- , text ("Counter: " ++ toString model.n)
        -- , Expo.view
        --     [ Attr.double "width" 80
        --     , Attr.string "flexDirection" "row"
        --     , Attr.string "justifyContent" "space-between"
        --     ]
        --     [ button Decrement Color.red "-"
        --     , button Increment Color.green "+"
        --     ]
        -- ]

button : Msg -> Color -> String -> Node Msg
button msg color content =
    node "RCTText"
        [ Attr.color "color" Color.white
        , Attr.string "textAlign" "center"
        , Attr.color "backgroundColor" color
        , Attr.double "paddingTop" 5
        , Attr.double "paddingBottom" 5
        , Attr.double "width" 30
        , Attr.string "fontWeight" "bold"
        , Attr.color "shadowColor" Color.black
        , Attr.double "shadowOpacity" 0.25
        -- , Attr.string "shadowOffset" 1 1
        , Attr.double "shadowRadius" 5
        -- , Attr.string "transform" { defaultTransform | rotate = Just "10deg" }
        -- , Attr.on "press" msg
        , on "topTouchEnd" (Json.succeed msg)
        ]
        [ node "RCTRawText"
            [ Attr.string "text" content ]
            [ ]
        ]

{--
    let
        imageSource =
            { uri = "https://raw.githubusercontent.com/futurice/spiceprogram/master/assets/img/logo/chilicorn_no_text-128.png"
            , cache = Just ForceCache
            }
    in
        Elements.view
            [ Ui.style [ Style.alignItems "center" ]
            ]
            [ image
                [ Ui.style
                    [ Style.height 64
                    , Style.width 64
                    , Style.marginBottom 30
                    , Style.marginTop 30
                    ]
                , source imageSource
                ]
                []
            , text
                [ Ui.style
                    [ Style.textAlign "center"
                    , Style.marginBottom 30
                    ]
                ]
                [ Ui.string ("Counter: " ++ toString model.n)
                ]
            , Elements.view
                [ Ui.style
                    [ Style.width 80
                    , Style.flexDirection "row"
                    , Style.justifyContent "space-between"
                    ]
                ]
                [ button Decrement "#d33" "-"
                , button Increment "#3d3" "+"
                ]
            , text
                [ Ui.style
                    [ Style.textAlign "center"
                    , Style.marginBottom 30
                    ]
                ]
                [ Ui.string ("err? : " ++ model.failed)
                ]
            , button Alert "#33d" "!"
            ]


button : Msg -> String -> String -> Node Msg
button msg color content =
    text
        [ Ui.style
            [ Style.color "white"
            , Style.textAlign "center"
            , Style.backgroundColor color
            , Style.paddingTop 5
            , Style.paddingBottom 5
            , Style.width 30
            , Style.fontWeight "bold"
            , Style.shadowColor "#000"
            , Style.shadowOpacity 0.25
            , Style.shadowOffset 1 1
            , Style.shadowRadius 5
            , Style.transform { defaultTransform | rotate = Just "10deg" }
            ]
        , onPress msg
        ]
        [ Ui.string content ]

--}



-- PROGRAM


main : Program Never Model Msg
main =
    Expo.program
        { init = ( model, Cmd.none )
        , view = view
        , update = update
        -- , subscriptions = \model -> Expo.downs TouchDown
        , subscriptions = \_ -> Sub.none
        }
