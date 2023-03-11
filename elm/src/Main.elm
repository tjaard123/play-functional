module Main exposing (..)

import Browser
import Html exposing (..) 
import Html.Attributes exposing (class)
import Http
import Json.Decode as JSON exposing (..)
import Html.Events exposing (onClick)

main =
  Browser.element
    { init = init
    , update = update
    , subscriptions = subscriptions
    , view = view
    }

-- type Categories = List String

type Model
  = Failure
  | Loading
  | LoadingJoke Chuck
  | Ready Chuck

type alias Chuck =
  { categories : (List String)
  , joke : (Maybe String)
  }

init : () -> (Model, Cmd Msg)
init _ =
  ( Loading
  , Http.get
      { url = "https://api.chucknorris.io/jokes/categories"
      , expect = Http.expectJson GotCategories stringArrayDecoder
      }
  )

type Msg
  = GotCategories (Result Http.Error (List String))
  | GenerateJoke String
  | GotJoke (Result Http.Error String)

stringArrayDecoder : JSON.Decoder (List String)
stringArrayDecoder =
    JSON.list JSON.string

jokeDecoder : JSON.Decoder String
jokeDecoder =
    JSON.field "value" JSON.string    

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
  case msg of
    GotCategories result ->
      case result of
        Ok categories ->
          (Ready { categories = categories, joke = Nothing }, Cmd.none)

        Err _ ->
          (Failure, Cmd.none)
    GenerateJoke category ->
      case model of
         Ready chuck ->
            ( LoadingJoke chuck
              , Http.get
                { url = "https://api.chucknorris.io/jokes/random?category=" ++ category
                , expect = Http.expectJson GotJoke jokeDecoder
                }
            )
         _ -> (Failure, Cmd.none)
    GotJoke result ->
      case result of
        Ok theJoke ->
          case model of
            LoadingJoke chuck -> (Ready { categories = chuck.categories, joke = (Just theJoke) }, Cmd.none)
            _ -> (Failure, Cmd.none)

        Err _ ->
          (Failure, Cmd.none)

subscriptions : Model -> Sub Msg
subscriptions model =
  Sub.none

view : Model -> Html Msg
view model =
  case model of
    Failure ->
      h1 [] [ text "Woops, I can't generate jokes today :(" ]

    Loading ->
      h1 [] [ text "Let me see if I can find Chuck..." ]

    LoadingJoke _ ->
      h1 [] [ text "Hang on while I clear my throat..." ]

    Ready chuck ->
      div []
        [ div [ class "categories" ]
          (List.map (\category -> button [ onClick (GenerateJoke category) ] [ text category ] ) chuck.categories)
        , case chuck.joke of
            Just theJoke ->
              h1 [] [ text theJoke ]
            Nothing -> 
              h1 [] [ text "What kind of joke would make you happy?" ]
        ]
      